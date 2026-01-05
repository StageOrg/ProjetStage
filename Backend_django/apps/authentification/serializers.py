
from rest_framework import serializers
from apps.authentification.services.register_service import RegisterService
from apps.utilisateurs.models import Utilisateur
from .utils import generate_username
from apps.utilisateurs.models import Etudiant, Utilisateur
from apps.utilisateurs.serializers import (
    EtudiantSerializer,
    ProfesseurSerializer,
    SecretaireSerializer,
    RespInscriptionSerializer,
    ResponsableSaisieNoteSerializer,
    AdministrateurSerializer,
    GestionnaireSerializer,
    ChefDepartementSerializer
)
from apps.utilisateurs.models import (
    Professeur,
    Secretaire,
    RespInscription,
    ResponsableSaisieNote,
    Administrateur,
    Gestionnaire,
    ChefDepartement
)
from django.contrib.auth.password_validation import validate_password
# Association rôle → serializer correspondant
ROLE_SERIALIZER_MAP = {
    'etudiant': EtudiantSerializer,
    'professeur': ProfesseurSerializer,
    'secretaire': SecretaireSerializer,
    'resp_inscription': RespInscriptionSerializer,
    'resp_notes': ResponsableSaisieNoteSerializer,
    'admin': AdministrateurSerializer,
    'gestionnaire': GestionnaireSerializer,
    'chef_dpt': ChefDepartementSerializer,
}

# Serializer principal pour l'enregistrement
class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=list(ROLE_SERIALIZER_MAP.keys()))
    data = serializers.DictField()

    def validate(self, attrs):
        role = attrs.get('role')
        serializer_class = ROLE_SERIALIZER_MAP[role]

        # On valide les données fournies pour le rôle choisi
        nested_serializer = serializer_class(data=attrs['data'])
        nested_serializer.is_valid(raise_exception=True)

        # On stocke les infos utiles pour create()
        attrs['validated_data'] = nested_serializer.validated_data
        attrs['serializer_class'] = serializer_class
        return attrs

    def create(self, validated_data):
        serializer_class = validated_data['serializer_class']
        nested_data = validated_data['validated_data']
        # On délègue la création à la logique du serializer spécifique
        return serializer_class().create(nested_data)
 
 
 
 
# Serializer pour l'enregistrement partiel
class PartialRegisterSerializer(serializers.Serializer):
    nom = serializers.CharField()
    prenom = serializers.CharField()
    email = serializers.EmailField()
    telephone = serializers.CharField()
    sexe = serializers.ChoiceField(choices=['M', 'F'])
    role = serializers.ChoiceField(choices=Utilisateur.ROLES)

    def create(self, validated_data):
        prenom = validated_data['prenom']
        nom = validated_data['nom']
        role = validated_data['role']

        username = generate_username(prenom, nom)

        # ✅ 1. Création de l'utilisateur
        user = Utilisateur.objects.create(
            username=username,
            first_name=prenom,
            last_name=nom,
            email=validated_data['email'],
            telephone=validated_data['telephone'],
            sexe=validated_data['sexe'],
            role=role,
            is_active=True
        )

        # ✅ 2. Création AUTOMATIQUE du profil lié selon le rôle
       
        if role == 'professeur':
            Professeur.objects.create(utilisateur=user)

        elif role == 'secretaire':
            Secretaire.objects.create(utilisateur=user)

        elif role == 'responsable_inscription':
            RespInscription.objects.create(utilisateur=user)

        elif role == 'responsable_notes':
            ResponsableSaisieNote.objects.create(utilisateur=user)

        elif role == 'admin':
            Administrateur.objects.create(utilisateur=user)

        return user





# Serializer pour l'enregistrement d'un étudiant avec création utilisateur intégrée
class StudentRegisterSerializer(serializers.ModelSerializer):
    # Champs utilisateur
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    telephone = serializers.CharField(required=False, allow_blank=True)
    sexe = serializers.ChoiceField(choices=[('M', 'Masculin'), ('F', 'Féminin')], required=False, allow_blank=True)
    
    # Champs étudiant
    autre_prenom = serializers.CharField(required=False, allow_blank=True)
    num_carte = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)
    date_naiss = serializers.DateField(required=False, allow_null=True)
    lieu_naiss = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Etudiant
        fields = [
            "username", "email", "password", "first_name", "last_name",
            "telephone", "date_naiss", "lieu_naiss", "autre_prenom",
            "num_carte", "photo", "sexe"
        ]

    def create(self, validated_data):
        # Extraire les données utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'first_name': validated_data.pop('first_name', ''),
            'last_name': validated_data.pop('last_name', ''),
            'telephone': validated_data.pop('telephone', ''),
            'sexe': validated_data.pop('sexe', ''),
            'role': 'etudiant'
        }

        # Vérifier que le modèle Utilisateur accepte ces champs
        try:
            user = Utilisateur.objects.create_user(**user_data)
        except Exception as e:
            raise serializers.ValidationError(f"Erreur lors de la création de l'utilisateur : {str(e)}")

        # Créer l'étudiant avec les données restantes
        try:
            # Normaliser num_carte : accepter '', None ou nombre
            raw_num_carte = validated_data.pop('num_carte', None)
            if raw_num_carte in [None, '']:
                num_carte_val = None
            else:
                try:
                    num_carte_val = int(str(raw_num_carte).strip())
                except (ValueError, TypeError):
                    # Si la conversion échoue, lever une ValidationError claire
                    user.delete()
                    raise serializers.ValidationError("Le numéro de carte doit être un entier valide de 6 chiffres")

            etudiant = Etudiant.objects.create(
                utilisateur=user,
                autre_prenom=validated_data.pop('autre_prenom', ''),
                num_carte=num_carte_val,
                photo=validated_data.pop('photo', None),
                date_naiss=validated_data.pop('date_naiss', None),
                lieu_naiss=validated_data.pop('lieu_naiss', '')
            )
        except Exception as e:
            # Supprimer l'utilisateur si la création de l'étudiant échoue
            user.delete()
            raise serializers.ValidationError(f"Erreur lors de la création de l'étudiant : {str(e)}")

        return etudiant