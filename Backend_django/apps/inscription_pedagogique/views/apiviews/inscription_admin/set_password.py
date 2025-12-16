# apps/utilisateurs/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from apps.utilisateurs.models import Utilisateur
from django.shortcuts import get_object_or_404


class SetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        old_password = request.data.get('old_password')  # optionnel

        if not all([uidb64, token, new_password]):
            return Response(
                {"error": "Tous les champs sont obligatoires : uid, token, new_password"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # CORRECTIF PRINCIPAL : gestion propre du décodage
            uid = urlsafe_base64_decode(uidb64).decode('utf-8')
            user = get_object_or_404(Utilisateur, pk=uid)

            # Vérification du token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Le lien est invalide ou a expiré."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Si mot de passe temporaire fourni → vérification
            if old_password is not None:
                if not user.check_password(old_password):
                    return Response(
                        {"error": "Mot de passe temporaire incorrect."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Validation du nouveau mot de passe
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response(
                    {"error": " ".join(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # TOUT EST BON → on change le mot de passe
            user.set_password(new_password)
            user.doit_changer_mdp = False
            user.save(update_fields=['password', 'doit_changer_mdp'])  # plus rapide + sûr

            return Response(
                {"message": "Mot de passe mis à jour avec succès. Vous pouvez vous connecter."},
                status=status.HTTP_200_OK
            )

        except (TypeError, ValueError, OverflowError, Utilisateur.DoesNotExist):
            return Response(
                {"error": "Lien invalide ou utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Pour debug en dev uniquement
            print(f"[ERREUR] SetPasswordView: {e}")
            return Response(
                {"error": "Une erreur est survenue. Réessayez à nouveau."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )