from apps.utilisateurs.models import (
    Utilisateur, Etudiant, Professeur, Secretaire,
    RespInscription, ResponsableSaisieNote, Gestionnaire, ChefDepartement
)
from django.db import transaction

class RegisterService:

    @staticmethod
    @transaction.atomic
    def register_user(user_data, profil_data):
        """
        Crée un utilisateur + son profil automatiquement.
        :param user_data: dict avec les champs de base (username, email, password, role)
        :param profil_data: dict avec les champs spécifiques au profil
        :return: instance du profil créé
        """

        role = user_data.get("role")
        print(f"=== Rôle reçu brut : {repr(role)} ===")
        if role not in dict(Utilisateur.ROLES):
            raise ValueError(f"Rôle invalide: {role}")

        # Création de l'utilisateur
        password = user_data.pop("password")
        utilisateur = Utilisateur.objects.create_user(**user_data)
        utilisateur.set_password(password)
        utilisateur.role = role
        utilisateur.save()

        # Création du profil selon le rôle
        if role == "etudiant":
            profil = Etudiant.objects.create(utilisateur=utilisateur, **profil_data)

        elif role == "professeur":
            profil = Professeur.objects.create(utilisateur=utilisateur, **profil_data)

        elif role == "secretaire":
            profil = Secretaire.objects.create(utilisateur=utilisateur, **profil_data)

        elif role == "resp_inscription":
            profil = RespInscription.objects.create(utilisateur=utilisateur, **profil_data)

        elif role == "resp_notes":
            profil = ResponsableSaisieNote.objects.create(utilisateur=utilisateur, **profil_data)
        
        elif role == "gestionnaire":
            profil = Gestionnaire.objects.create(utilisateur= utilisateur, **profil_data)
        elif role == "chef_dpt":
            profil = ChefDepartement.objects.create(utilisateur= utilisateur, **profil_data)
        else:
            raise ValueError(f"Gestion du rôle '{role}' non implémentée")

        return profil
