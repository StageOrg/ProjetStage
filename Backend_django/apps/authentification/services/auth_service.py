# apps/authentification/services/auth_service.py
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.utilisateurs.models import Etudiant

# Récupération du modèle utilisateur personnalisé
User = get_user_model()




User = get_user_model()

class AuthService:

    @staticmethod
    def login(username, password):
        # Vérifie si l'utilisateur existe avec ce username
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None  

        # Vérifie le mot de passe
        user_auth = authenticate(username=user.username, password=password)
        if user_auth is None:
            return None  # Mauvais mot de passe

        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)

        # Récupérer num_carte si étudiant
        num_carte = None
        if hasattr(user, 'etudiant') and user.etudiant:
            num_carte = user.etudiant.num_carte

        # Retourne l'utilisateur + tokens
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role":  user.role ,
                "sexe": user.sexe,
                "telephone": user.telephone,
                "num_carte": num_carte, # Ajout du numéro de carte
            },
            "message": f"Bienvenue {user.first_name} !"
        }
        
        

""" class AuthService:

    @staticmethod
    def login(username, password):
        user = authenticate(username=username, password=password)
        if not user:
            return None  # Mauvais identifiants

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        } """
