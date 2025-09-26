
from rest_framework import serializers
from apps.utilisateurs.models import Etudiant, Utilisateur
from apps.utilisateurs.serializers import (
    EtudiantSerializer,
    ProfesseurSerializer,
    SecretaireSerializer,
    RespInscriptionSerializer,
    ResponsableSaisieNoteSerializer,
    AdministrateurSerializer
)
from django.contrib.auth.password_validation import validate_password
# Association rôle → serializer correspondant
ROLE_SERIALIZER_MAP = {
    'etudiant': EtudiantSerializer,
    'professeur': ProfesseurSerializer,
    'secretaire': SecretaireSerializer,
    'resp_inscription': RespInscriptionSerializer,
    'resp_notes': ResponsableSaisieNoteSerializer,
    'admin': AdministrateurSerializer
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
            etudiant = Etudiant.objects.create(
                utilisateur=user,
                autre_prenom=validated_data.pop('autre_prenom', ''),
                num_carte=validated_data.pop('num_carte', ''),
                photo=validated_data.pop('photo', None),
                date_naiss=validated_data.pop('date_naiss', None),
                lieu_naiss=validated_data.pop('lieu_naiss', '')
            )
        except Exception as e:
            # Supprimer l'utilisateur si la création de l'étudiant échoue
            user.delete()
            raise serializers.ValidationError(f"Erreur lors de la création de l'étudiant : {str(e)}")

        return etudiant