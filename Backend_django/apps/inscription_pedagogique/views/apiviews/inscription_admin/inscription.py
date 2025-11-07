# apps/inscription_pedagogique/views/apiviews/inscription_admin/inscription.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.utilisateurs.models import Etudiant, Utilisateur
from django.db import transaction
from django.utils.crypto import get_random_string
from django.http import StreamingHttpResponse
from io import StringIO
import pandas as pd
import pdfplumber
import re
import csv

from apps.inscription_pedagogique.models import (
    Inscription, Filiere, Parcours, AnneeEtude, AnneeAcademique, ImportEtudiant
)
from apps.page_professeur.models import UE


class InscriptionEtudiantView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # Vérifie les droits
        if not hasattr(request.user, 'resp_inscription'):
            return Response({'error': 'Accès refusé'}, status=status.HTTP_403_FORBIDDEN)

        # Cas 1 : création manuelle
        if 'fichier' not in request.FILES:
            try:
                result = self._creer_etudiant_manuel(request.data.copy())
                return Response(result, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Cas 2 : import fichier
        fichier = request.FILES['fichier']
        extension = fichier.name.lower().split('.')[-1]

        if extension == 'csv':
            df = pd.read_csv(fichier)
        elif extension in ['xlsx', 'xls']:
            df = pd.read_excel(fichier)
        elif extension == 'pdf':
            df = self._extraire_pdf(fichier)
        else:
            return Response({'error': 'Format non supporté'}, status=status.HTTP_400_BAD_REQUEST)

        resultat = self._importer_pandas(df, fichier, extension[:4])
        if isinstance(resultat, StreamingHttpResponse):
            return resultat
        return Response(resultat, status=status.HTTP_200_OK)

    # --------------------------------------------------------------------- #
    # 1. Création manuelle
    # --------------------------------------------------------------------- #
    def _creer_etudiant_manuel(self, data):
        try:
            data = self._generer_identifiants(data)

            # Création utilisateur avec champs personnalisés via **extra_fields
            user = Utilisateur.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                telephone=data.get('telephone', ''),
                sexe=data.get('sexe', ''),
                role='etudiant',
                doit_changer_mdp=True  # Champ personnalisé accepté
            )

            # Création étudiant
            etudiant = Etudiant.objects.create(
                utilisateur=user,
                num_carte=self._parse_num_carte(data.get('num_carte')),
                autre_prenom=data.get('autre_prenom', ''),
                date_naiss=data.get('date_naiss'),
                lieu_naiss=data.get('lieu_naiss', '')
            )

            numero_inscription = None
            annee_academique_libelle = None
            try:
                filiere_nom = data.get('filiere', '').strip()
                parcours_lib = data.get('parcours', '').strip()
                annee_lib = data.get('annee_etude', '').strip()

                if filiere_nom and parcours_lib and annee_lib:
                    filiere = Filiere.objects.get(nom__iexact=filiere_nom)
                    parcours = Parcours.objects.get(libelle__iexact=parcours_lib)
                    annee_etude = AnneeEtude.objects.get(libelle__iexact=annee_lib)
                    annee_acad = AnneeAcademique.objects.get(est_active=True)

                    numero_inscription = f"INS-{etudiant.num_carte or etudiant.id}-{annee_acad.libelle}"
                    inscription = Inscription.objects.create(
                        etudiant=etudiant,
                        filiere=filiere,
                        parcours=parcours,
                        annee_etude=annee_etude,
                        anneeAcademique=annee_acad,
                        numero=numero_inscription
                    )
                    ues = UE.objects.filter(filiere=filiere, parcours=parcours, annee_etude=annee_etude)
                    inscription.ues.add(*ues)
                    annee_academique_libelle = annee_acad.libelle
            except Exception as e:
                print(f"[INFO] Inscription pédagogique échouée : {e}")

            return {
                'success': True,
                'etudiant_id': etudiant.id,
                'username': user.username,
                'email': user.email,
                'mot_de_passe_temporaire': data['password'],
                'numero_inscription': numero_inscription,
                'annee_academique': annee_academique_libelle
            }

        except Exception as e:
            if 'user' in locals():
                user.delete()
            raise

    # --------------------------------------------------------------------- #
    # 2. Génération identifiants
    # --------------------------------------------------------------------- #
    def _generer_identifiants(self, data):
        if not data.get('username'):
            prenom = re.sub(r'[^a-z]', '', data.get('first_name', '').lower())
            nom = re.sub(r'[^a-z]', '', data.get('last_name', '').lower())
            base = f"{prenom}.{nom}" if prenom and nom else "etudiant"
            username = base
            i = 1
            while Utilisateur.objects.filter(username=username).exists():
                username = f"{base}{i}"
                i += 1
            data['username'] = username

        data['password'] = get_random_string(10)
        return data

    # --------------------------------------------------------------------- #
    # 3. Parsing numéro de carte
    # --------------------------------------------------------------------- #
    def _parse_num_carte(self, value):
        if not value or str(value).strip() in ['', 'None']:
            return None
        try:
            val = int(str(value).strip())
            return val if val <= 999999 else None
        except:
            return None

    # --------------------------------------------------------------------- #
    # 4. Extraction PDF
    # --------------------------------------------------------------------- #
    def _extraire_pdf(self, fichier):
        text = ""
        with pdfplumber.open(fichier) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        blocs = re.split(r'\n\s*\n', text)
        etudiants = []
        KEY_MAPPING = {
            'nom': 'last_name', 'prénom': 'first_name', 'prenom': 'first_name',
            'email': 'email', 'téléphone': 'telephone', 'telephone': 'telephone',
            'date de naissance': 'date_naiss', 'lieu de naissance': 'lieu_naiss',
            'num carte': 'num_carte', 'filière': 'filiere', 'filiere': 'filiere',
            'parcours': 'parcours', 'année': 'annee_etude', 'annee': 'annee_etude',
        }

        for bloc in blocs:
            etudiant = {}
            lignes = [l.strip() for l in bloc.split('\n') if ':' in l]
            for ligne in lignes:
                if ':' not in ligne:
                    continue
                key, value = ligne.split(':', 1)
                key = key.strip().lower()
                field = next((v for k, v in KEY_MAPPING.items() if k in key), None)
                if field:
                    etudiant[field] = value.strip()

            if etudiant.get('first_name') and etudiant.get('last_name') and etudiant.get('email'):
                etudiants.append(etudiant)

        return pd.DataFrame(etudiants)

    # --------------------------------------------------------------------- #
    # 5. Import massif
    # --------------------------------------------------------------------- #
    def _importer_pandas(self, df, fichier_upload, type_fichier):
        reussis = []
        echoues = []

        for idx, row in df.iterrows():
            data = {
                'first_name': str(row.get('first_name') or row.get('prenom', '')).strip(),
                'last_name': str(row.get('last_name') or row.get('nom', '')).strip(),
                'email': str(row.get('email', '')).strip(),
                'telephone': str(row.get('telephone', '')).strip(),
                'date_naiss': str(row.get('date_naiss', '')).strip(),
                'lieu_naiss': str(row.get('lieu_naiss', '')).strip(),
                'num_carte': str(row.get('num_carte', '')) if pd.notna(row.get('num_carte')) else '',
                'autre_prenom': str(row.get('autre_prenom', '')).strip(),
                'sexe': str(row.get('sexe', 'M')).strip().upper()[:1],
                'filiere': str(row.get('filiere') or row.get('filière', '')).strip(),
                'parcours': str(row.get('parcours', '')).strip(),
                'annee_etude': str(row.get('annee_etude') or row.get('année', '')).strip(),
            }
            data = {k: v for k, v in data.items() if v}

            try:
                result = self._creer_etudiant_manuel(data)
                info = {
                    'ligne': idx + 2,
                    'nom': data.get('last_name'),
                    'prenom': data.get('first_name'),
                    'email': result.get('email'),
                    'username': result.get('username'),
                    'mot_de_passe_temporaire': result.get('mot_de_passe_temporaire')
                }
                reussis.append(info)
            except Exception as e:
                echoues.append({'ligne': idx + 2, 'erreur': str(e)})

        import_log = ImportEtudiant.objects.create(
            admin=self.request.user,
            fichier=fichier_upload,
            type_fichier=type_fichier,
            reussis=len(reussis),
            echoues=len(echoues),
            details={'reussis': reussis, 'echoues': echoues}
        )

        if reussis:
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Ligne', 'Nom', 'Prénom', 'Email', 'Username', 'Mot de passe temporaire'])
            for r in reussis:
                writer.writerow([
                    r['ligne'], r['nom'], r['prenom'], r['email'],
                    r['username'], r['mot_de_passe_temporaire']
                ])

            response = StreamingHttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="identifiants_import_{import_log.id}.csv"'
            return response

        return {
            'reussis': len(reussis),
            'echoues': len(echoues),
            'details': echoues,
            'import_id': import_log.id
        }