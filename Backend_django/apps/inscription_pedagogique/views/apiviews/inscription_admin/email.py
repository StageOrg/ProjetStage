from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.utilisateurs.models import Etudiant
from django.core.mail import send_mail
from django.conf import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

class EnvoyerLienConnexionView(APIView):
    permission_classes = [IsAuthenticated]

    def dispatch(self, request, *args, **kwargs):
        if not hasattr(request.user, 'resp_inscription'):
            return Response({'error': 'Accès refusé'}, status=403)
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, etudiant_id):
        try:
            etudiant = Etudiant.objects.select_related('utilisateur').get(id=etudiant_id)
            user = etudiant.utilisateur

            # Générer lien de première connexion
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            lien = f"{settings.FRONTEND_URL}/premiere-connexion/{uid}/{token}/"

            # Envoyer email
            send_mail(
                subject="Votre compte étudiant est prêt !",
                message=f"""
                Bonjour {user.first_name} {user.last_name},

                Votre compte a été créé avec succès.

                👉 Identifiant : {user.username}
                👉 Lien de première connexion : {lien}

                Cliquez sur le lien ci-dessus pour définir votre mot de passe.
                Ce lien expire dans 24 heures.

                Cordialement,
                L'équipe des inscriptions
                """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return Response({'success': True, 'message': 'Email envoyé'})
        except Etudiant.DoesNotExist:
            return Response({'error': 'Étudiant non trouvé'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)