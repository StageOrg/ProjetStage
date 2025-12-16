# apps/inscription_pedagogique/views/apiviews/renvoyer_identifiants.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.utilisateurs.models import Utilisateur
from django.utils.crypto import get_random_string
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import base64
import logging

logger = logging.getLogger(__name__)


class RenvoyerIdentifiantsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Vérifier que c'est un responsable inscription
        if not hasattr(request.user, 'resp_inscription'):
            return Response({"error": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get("recherche", "").strip()
        if not email:
            return Response({"error": "Veuillez entrer l'email de l'étudiant"}, status=status.HTTP_400_BAD_REQUEST)

        # Recherche UNIQUEMENT par email (insensible à la casse)
        try:
            user = Utilisateur.objects.get(role='etudiant', email__iexact=email)
        except Utilisateur.DoesNotExist:
            return Response({"error": "Aucun étudiant trouvé avec cet email"}, status=status.HTTP_404_NOT_FOUND)
        except Utilisateur.MultipleObjectsReturned:
            # Très rare, mais on gère quand même
            return Response({"error": "Plusieurs comptes avec cet email. Contactez l'administrateur."}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un nouveau mot de passe temporaire
        nouveau_mdp = get_random_string(12)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        pwd_encoded = base64.b64encode(nouveau_mdp.encode()).decode()
        lien = f"{settings.FRONTEND_URL}/premiere_connexion/{uid}/{token}?pwd={pwd_encoded}"

        sujet = "[EPL] Vos identifiants de connexion (renvoyés)"
        message = f"""
Bonjour {user.first_name} {user.last_name},

Un responsable vous a renvoyé vos identifiants.

Identifiant : {user.username}
Mot de passe temporaire : {nouveau_mdp}

Lien valable 10 jours :
{lien}

Connectez-vous et changez votre mot de passe dès maintenant.

Cordialement,
École Polytechnique de Lomé
        """.strip()

        try:
            send_mail(
                subject=sujet,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info(f"Identifiants renvoyés à {user.email} ({user.username})")
            return Response({
                "success": True,
                "message": "Identifiants renvoyés avec succès !",
                "etudiant": {
                    "username": user.username,
                    "email": user.email,
                    "nouveau_mot_de_passe": nouveau_mdp
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Échec envoi email à {user.email} : {e}")
            return Response({"error": "Échec de l'envoi de l'email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)