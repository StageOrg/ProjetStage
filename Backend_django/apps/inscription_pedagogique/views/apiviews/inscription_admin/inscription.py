import base64
import csv
import re
from io import StringIO

import pandas as pd
import pdfplumber
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.http import StreamingHttpResponse
from django.utils.crypto import get_random_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.utilisateurs.models import RespInscription  
from apps.inscription_pedagogique.models import (
    AnneeAcademique,
    AnneeEtude,
    Filiere,
    ImportEtudiant,
    Inscription,
    Parcours,
)
from apps.page_professeur.models import UE
from apps.utilisateurs.models import Etudiant, Utilisateur


class InscriptionEtudiantView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
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

        resultat = self._importer_pandas(df, fichier, extension)
        return resultat if isinstance(resultat, StreamingHttpResponse) else Response(resultat, status=status.HTTP_200_OK)

    # =====================================================================
    # 1. Création manuelle
    # =====================================================================
    def _creer_etudiant_manuel(self, data):
        try:
            data = self._generer_identifiants(data)

            # Création utilisateur
            user = Utilisateur.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                telephone=data.get('telephone', ''),
                sexe=data.get('sexe', 'M'),
                role='etudiant',
                doit_changer_mdp=True
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
                # Récupérer les objets pédagogiques
                filiere = Filiere.objects.get(id=data['filiere_id'])
                parcours = Parcours.objects.get(id=data['parcours_id'])
                annee_etude = AnneeEtude.objects.get(id=data['annee_etude_id'])
                annee_acad = AnneeAcademique.objects.get(est_active=True)

                # Générer numéro
                numero_inscription = f"INS-{etudiant.num_carte or etudiant.id}-{annee_acad.libelle}"

                # Créer inscription
                inscription = Inscription.objects.create(
                    etudiant=etudiant,
                    filiere=filiere,
                    parcours=parcours,
                    annee_etude=annee_etude,
                    anneeAcademique=annee_acad,
                    numero=numero_inscription
                )

                # === AJOUT DES UEs ===
                ues_a_ajouter = UE.objects.filter(
                    filiere=filiere,
                    parcours=parcours,
                    annee_etude=annee_etude
                )
                inscription.ues.add(*ues_a_ajouter)

                annee_academique_libelle = annee_acad.libelle

            except Exception as e:
                print(f"[INFO] Inscription pédagogique échouée : {e}")

            # === ENVOI EMAIL ===
            try:
                self._envoyer_email_premiere_connexion(user, data['password'])
            except Exception as e:
                print(f"[ERREUR EMAIL] : {e}")

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

    # =====================================================================
    # 2. Génération identifiants
    # =====================================================================
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
        data['password'] = get_random_string(12)
        return data

    # =====================================================================
    # 3. Parsing numéro de carte
    # =====================================================================
    def _parse_num_carte(self, value):
        if not value or str(value).strip() in ['', 'None']:
            return None
        try:
            val = int(str(value).strip())
            return val if val <= 999999 else None
        except:
            return None

    # =====================================================================
    # 4. Envoi email
    # =====================================================================
    def _envoyer_email_premiere_connexion(self, user, mot_de_passe_temp):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        pwd_encoded = base64.b64encode(mot_de_passe_temp.encode()).decode()
        lien_premiere = f"{settings.FRONTEND_URL}/premiere_connexion/{uid}/{token}?pwd={pwd_encoded}"

        sujet = "Vos identifiants de connexion"
        message = f"""
        Bonjour {user.first_name} {user.last_name},

        Votre compte étudiant a été créé avec succès.

        Identifiant : {user.username}
        Mot de passe temporaire : {mot_de_passe_temp}


        À votre première connexion, vous devrez changer votre mot de passe.
        Lien direct : {lien_premiere}

        Cordialement,
        Responsable d'inscription 
        """

        send_mail(
            subject=sujet,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    # =====================================================================
    # 5. Extraction PDF
    # =====================================================================
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
            'num carte': 'num_carte',
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

        # =====================================================================
    # 6. Import massif – VERSION FINALE 100% FONCTIONNELLE
    # =====================================================================
    def _importer_pandas(self, df, fichier_upload, extension):
        reussis = []
        echoues = []
    
        # Récupération des filtres
        parcours_id = self.request.POST.get('parcours_id')
        filiere_id = self.request.POST.get('filiere_id')
        annee_etude_id = self.request.POST.get('annee_etude_id')
        if not all([parcours_id, filiere_id, annee_etude_id]):
            raise ValueError("Les filtres (parcours, filière, année) sont obligatoires pour l'import.")
    
        if 'date_naiss' in df.columns:
            df['date_naiss'] = pd.to_datetime(
                df['date_naiss'],
                dayfirst=True,           
                errors='coerce'          
            )
            df['date_naiss'] = df['date_naiss'].dt.date         
            df['date_naiss'] = df['date_naiss'].replace({pd.NaT: None})  
    
        for idx, row in df.iterrows():
            data = {
                'first_name': str(row.get('first_name') or row.get('prenom', '') or '').strip(),
                'last_name': str(row.get('last_name') or row.get('nom', '') or '').strip(),
                'email': str(row.get('email', '') or '').strip().lower(),
                'telephone': str(row.get('telephone', '') or '').strip(),
                'date_naiss': row.get('date_naiss'),  # objet date ou None → parfait pour Django
                'lieu_naiss': str(row.get('lieu_naiss', '') or '').strip(),
                'num_carte': str(row.get('num_carte', '')) if pd.notna(row.get('num_carte')) else None,
                'autre_prenom': str(row.get('autre_prenom', '') or '').strip(),
                'sexe': str(row.get('sexe', 'M') or 'M').strip().upper()[:1],
                'parcours_id': int(parcours_id),
                'filiere_id': int(filiere_id),
                'annee_etude_id': int(annee_etude_id),
            }
    
            data = {k: v for k, v in data.items() if v not in ['', None] or k == 'date_naiss'}
    
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
    
        # Log d'import
        import_log = ImportEtudiant.objects.create(
            admin=RespInscription.objects.get(utilisateur=self.request.user),
            fichier=fichier_upload,
            methode='import',
            reussis=len(reussis),
            echoues=len(echoues),
            details={'reussis': reussis, 'echoues': echoues}
        )
    
        # Retour CSV si succès
        if reussis:
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Ligne', 'Nom', 'Prénom', 'Email', 'Username', 'Mot de passe temporaire'])
            for r in reussis:
                writer.writerow([r['ligne'], r['nom'], r['prenom'], r['email'], r['username'], r['mot_de_passe_temporaire']])
            response = StreamingHttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="identifiants_import_{import_log.id}.csv"'
            return response
    
        return {
            'reussis': len(reussis),
            'echoues': len(echoues),
            'details': echoues,
            'import_id': import_log.id
        }