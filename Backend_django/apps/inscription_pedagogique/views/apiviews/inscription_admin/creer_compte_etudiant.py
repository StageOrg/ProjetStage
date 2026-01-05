# apps/inscription_pedagogique/views/apiviews/creer_compte_etudiant.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils.crypto import get_random_string
from apps.utilisateurs.models import Utilisateur, Etudiant
from django.core.mail import send_mail
from django.conf import settings
import re
import pandas as pd
import csv
from django.http import StreamingHttpResponse
from io import StringIO
import logging
from django.contrib.auth.tokens import default_token_generator
import base64
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

logger = logging.getLogger(__name__)

class CreerCompteEtudiantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not hasattr(request.user, 'resp_inscription'):
            return Response(
                {"error": "Accès refusé. Seuls les responsables d'inscription peuvent créer des comptes."},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'fichier' not in request.FILES:
            return self.creer_manuel(request.data)

        # Import fichier
        fichier = request.FILES['fichier']
        ext = fichier.name.lower().split('.')[-1]
        try:
            if ext == 'csv':
                df = pd.read_csv(fichier)
            elif ext in ['xlsx', 'xls']:
                df = pd.read_excel(fichier)
            elif ext == 'pdf':
                df = self.extraire_pdf(fichier)
            else:
                return Response(
                    {"error": "Format non supporté. Utilisez CSV, Excel ou PDF."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Erreur lecture fichier: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la lecture du fichier: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return self.importer_fichier(df)

    # =====================================================================
    # Création manuelle
    # =====================================================================
    @transaction.atomic
    def creer_manuel(self, data):
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip().lower()
        sexe = data.get('sexe', 'M').upper()[:1]

        if not first_name or not last_name or not email:
            return Response(
                {"error": "Prénom, nom et email sont obligatoires"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Utilisateur.objects.filter(email=email).exists():
            return Response(
                {"error": f"Un compte avec l'email {email} existe déjà"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if sexe not in ['M', 'F']:
            sexe = 'M'

        try:
            username = self.generer_username(first_name, last_name)
            password = get_random_string(12)

            user = Utilisateur.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                sexe=sexe,
                role='etudiant',
                doit_changer_mdp=True
            )

            # Profil étudiant vide → à compléter plus tard
            Etudiant.objects.create(utilisateur=user)

            # Envoi email → si échoue → on annule tout
            email_sent = self.envoyer_email(user, password)
            if not email_sent:
                raise Exception("Échec de l'envoi de l'email de première connexion")

            return Response({
                "success": True,
                "username": username,
                "email": user.email,
                "mot_de_passe_temporaire": password,
                "email_sent": True,
                "message": "Compte créé avec succès et email envoyé"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Erreur création manuelle pour {email}: {str(e)}")
            return Response(
                {"error": f"Échec de la création : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # =====================================================================
    # Import massif
    # =====================================================================
    @transaction.atomic
    def importer_fichier(self, df):
        reussis = []
        erreurs = []

        for index, row in df.iterrows():
            try:
                first_name = str(row.get('first_name') or row.get('prenom') or '').strip()
                last_name = str(row.get('last_name') or row.get('nom') or '').strip()
                email = str(row.get('email') or '').strip().lower()
                sexe = str(row.get('sexe', 'M')).upper()[:1]

                if not first_name or not last_name or not email:
                    erreurs.append({"ligne": index + 2, "raison": "Données incomplètes (prénom, nom, email)"})
                    continue

                if Utilisateur.objects.filter(email=email).exists():
                    erreurs.append({"ligne": index + 2, "email": email, "raison": "Email déjà utilisé"})
                    continue

                if sexe not in ['M', 'F']:
                    sexe = 'M'

                username = self.generer_username(first_name, last_name)
                password = get_random_string(12)

                user = Utilisateur.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    sexe=sexe,
                    role='etudiant',
                    doit_changer_mdp=True
                )

                Etudiant.objects.create(utilisateur=user)

                # Envoi email → si échoue → on considère l'étudiant comme échoué
                email_sent = self.envoyer_email(user, password)
                if not email_sent:
                    # On annule la création (grâce à @transaction.atomic sur chaque ligne)
                    raise Exception("Échec envoi email")

                reussis.append({
                    "username": username,
                    "mot_de_passe": password,
                    "email": email
                })

            except Exception as e:
                logger.error(f"Erreur ligne {index + 2} ({email}): {str(e)}")
                erreurs.append({"ligne": index + 2, "raison": str(e) or "Erreur inconnue"})
                continue  # continue → rollback automatique de cette ligne

        if not reussis:
            return Response(
                {"error": "Aucun compte créé avec succès", "erreurs": erreurs},
                status=status.HTTP_400_BAD_REQUEST
            )

        # CSV seulement pour les comptes réellement créés + email envoyé
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['username', 'mot_de_passe_temporaire', 'email'])
        writer.writerows([[r['username'], r['mot_de_passe'], r['email']] for r in reussis])

        response = StreamingHttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="comptes_etudiants.csv"'
        response['X-Total-Created'] = str(len(reussis))
        response['X-Total-Errors'] = str(len(erreurs))

        return response

    # =====================================================================
    # Génération username + envoi email + extraction PDF
    # =====================================================================
    def generer_username(self, prenom, nom):
        prenom_clean = re.sub(r'[^a-zA-Z]', '', prenom.lower())
        nom_clean = re.sub(r'[^a-zA-Z]', '', nom.lower())
        base = f"{prenom_clean}.{nom_clean}"
        username = base
        counter = 1
        while Utilisateur.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        return username

    def envoyer_email(self, user, mot_de_passe_temp):
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
Ecole Polytechnique de Lomé
""".strip()

        try:
            send_mail(
                subject=sujet,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Email envoyé avec succès à {user.email}")
            return True
        except Exception as e:
            logger.error(f"ÉCHEC envoi email à {user.email} : {str(e)}")
            return False

    def extraire_pdf(self, fichier):
        try:
            import pdfplumber
        except ImportError:
            raise Exception("pdfplumber n'est pas installé")

        text = ""
        with pdfplumber.open(fichier) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"

        lines = text.split('\n')
        data = []
        current = {}

        for line in lines:
            line_lower = line.lower()
            if 'nom' in line_lower and ':' in line:
                current['last_name'] = line.split(':', 1)[1].strip()
            elif 'prénom' in line_lower or 'prenom' in line_lower:
                if ':' in line:
                    current['first_name'] = line.split(':', 1)[1].strip()
            elif 'email' in line_lower or '@' in line:
                if ':' in line:
                    current['email'] = line.split(':', 1)[1].strip()
                elif '@' in line:
                    current['email'] = line.strip()

            if current.get('first_name') and current.get('last_name') and current.get('email'):
                data.append(current)
                current = {}

        return pd.DataFrame(data if data else [{}])