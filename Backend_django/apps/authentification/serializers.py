""" 

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.utilisateurs.models import Utilisateur, Etudiant



class LoginSerializer(serializers.Serializer):
    pseudo = serializers.CharField()
    password = serializers.CharField()


class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    pseudo = serializers.CharField(source='username')  # alias pour username

    class Meta:
        model = Utilisateur
        fields = ['email', 'nom', 'prenoms', 'pseudo', 'password']

    def create(self, validated_data):
        username = validated_data['username']  # alias pseudo
        email = validated_data['email']
        nom = validated_data['nom']
        prenoms = validated_data['prenoms']
        password = validated_data['password']

        user = Utilisateur.objects.create_user(
            username=username,
            email=email,
            nom=nom,
            prenoms=prenoms,
            password=password,
        )

        Etudiant.objects.create(utilisateur=user)
        return user


 """
 
""" from rest_framework import serializers
from apps.utilisateurs.serializers import (
    EtudiantSerializer,
    ProfesseurSerializer,
    SecretaireSerializer,
    RespInscriptionSerializer,
    ResponsableSaisieNoteSerializer,
    AdministrateurSerializer
)

ROLE_SERIALIZER_MAP = {
    'etudiant': EtudiantSerializer,
    'professeur': ProfesseurSerializer,
    'secretaire': SecretaireSerializer,
    'resp_inscription': RespInscriptionSerializer,
    'resp_notes': ResponsableSaisieNoteSerializer,
    'admin': AdministrateurSerializer
}

class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ROLE_SERIALIZER_MAP.keys())
    data = serializers.DictField()

    def validate(self, attrs):
        role = attrs['role']
        serializer_class = ROLE_SERIALIZER_MAP[role]
        nested_serializer = serializer_class(data=attrs['data'])
        if not nested_serializer.is_valid():
            raise serializers.ValidationError(nested_serializer.errors)
        attrs['validated_data'] = nested_serializer.validated_data
        attrs['serializer_class'] = serializer_class
        return attrs

    def create(self, validated_data):
        serializer_class = validated_data['serializer_class']
        return serializer_class().create(validated_data['validated_data'])
 """




from rest_framework import serializers
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
    
class StudentRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Etudiant
        fields = ["username", "email", "password", "num_carte", "date_naiss", "lieu_naiss"]

    def create(self, validated_data):
        username = validated_data.pop("username")
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        # Créer l’utilisateur
        user = Utilisateur.objects.create_user(
            username=username,
            email=email,
            password=password,
            role="etudiant"
        )

        # Créer l’étudiant
        etudiant = Etudiant.objects.create(utilisateur=user, **validated_data)
        return etudiant