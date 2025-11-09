# backend/apps/utilisateurs/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from apps.utilisateurs.models import  Utilisateur

class SetPasswordView(APIView):
    permission_classes = []
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        old_password = request.data.get('old_password')  # ✅ Nouveau
        
        if not all([uid, token, new_password]):
            return Response(
                {'error': 'Données manquantes'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = Utilisateur.objects.get(pk=user_id)
            
            # Vérifier le token
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Lien invalide ou expiré'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ Valider le mot de passe temporaire (optionnel)
            if old_password and not user.check_password(old_password):
                return Response(
                    {'error': 'Le mot de passe temporaire est incorrect'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Valider le nouveau mot de passe
            try:
                validate_password(new_password, user)
            except ValidationError as e:
                return Response(
                    {'error': ', '.join(e.messages)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Définir le nouveau mot de passe
            user.set_password(new_password)
            user.doit_changer_mdp = False
            user.save()
            
            print(f"✅ Mot de passe changé pour {user.username}")
            
            return Response(
                {'message': 'Mot de passe défini avec succès'}, 
                status=status.HTTP_200_OK
            )
            
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur introuvable'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"❌ Erreur set_password: {e}")
            return Response(
                {'error': 'Erreur lors de la définition du mot de passe'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )