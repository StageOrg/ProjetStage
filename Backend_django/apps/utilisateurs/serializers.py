from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.inscription_pedagogique.models import Inscription
from apps.page_professeur.models import Projet, Recherche, Article, Encadrement, Note
from apps.page_professeur.serializers import AffectationUeSerializer, NoteSerializer
from .models import (
    Utilisateur, Etudiant, Professeur, Administrateur,
    RespInscription, ResponsableSaisieNote, Secretaire, Connexion, Gestionnaire, ChefDepartement
)

# -------- UTILS --------
def creer_utilisateur_avec_role(utilisateur_data, role):
    """Crée un utilisateur et lui attribue un rôle."""
    password = utilisateur_data.pop('password')
    user = Utilisateur.objects.create_user(password=password, **utilisateur_data)
    user.role = role
    user.save()
    return user


# -------- UTILISATEUR DE BASE --------
class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'sexe', 'telephone', 'role', 'password']

    def create(self, validated_data):
        return Utilisateur.objects.create_user(**validated_data)


# -------- BASE PROFIL --------
class BaseProfilSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer()

    def create(self, validated_data):
        utilisateur_data = validated_data.pop('utilisateur')
        role = getattr(self.Meta, 'role', None)
        if not role:
            raise ValueError("Le serializer enfant doit définir Meta.role")
        utilisateur = creer_utilisateur_avec_role(utilisateur_data, role)
        return self.Meta.model.objects.create(utilisateur=utilisateur, **validated_data)

    def update(self, instance, validated_data):
        utilisateur_data = validated_data.pop('utilisateur', None)

        # Mise à jour des infos utilisateur liées
        if utilisateur_data:
            for attr, value in utilisateur_data.items():
                setattr(instance.utilisateur, attr, value)
            instance.utilisateur.save()

        # Gestion propre des champs simples et M2M
        for attr, value in validated_data.items():
            field = instance._meta.get_field(attr)
            if field.many_to_many:
                getattr(instance, attr).set(value)
            else:
                setattr(instance, attr, value)

        instance.save()
        return instance


# -------- ETUDIANT --------
class EtudiantSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='etudiant', read_only=True)
    inscriptions = serializers.PrimaryKeyRelatedField(queryset=Inscription.objects.all(), many=True, required=False)
    evaluations = NoteSerializer(source='notes', many=True, read_only=True)

    class Meta:
        model = Etudiant
        role = 'etudiant'
        fields = '__all__'


# -------- PROFESSEUR --------
class ProfesseurSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='professeur', read_only=True)
    ues = AffectationUeSerializer(source='affectations', many=True, required=False)
    projets = serializers.PrimaryKeyRelatedField(queryset=Projet.objects.all(), many=True, required=False)
    recherches = serializers.PrimaryKeyRelatedField(queryset=Recherche.objects.all(), many=True, required=False)
    articles = serializers.PrimaryKeyRelatedField(queryset=Article.objects.all(), many=True, required=False)
    encadrements = serializers.PrimaryKeyRelatedField(queryset=Encadrement.objects.all(), many=True, required=False)

    class Meta:
        model = Professeur
        role = 'professeur'
        fields = '__all__'


# -------- SECRETAIRE --------
class SecretaireSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='secretaire', read_only=True)

    class Meta:
        model = Secretaire
        role = 'secretaire'
        fields = '__all__'



# -------- RESPONSABLE INSCRIPTION --------
class RespInscriptionSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='resp_inscription', read_only=True)

    class Meta:
        model = RespInscription
        role = 'resp_inscription'
        fields = '__all__'


# -------- RESPONSABLE SAISIE NOTE --------
class ResponsableSaisieNoteSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='resp_notes', read_only=True)

    class Meta:
        model = ResponsableSaisieNote
        role = 'resp_notes'
        fields = '__all__'


# -------- ADMIN --------
class AdministrateurSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='admin', read_only=True)

    class Meta:
        model = Administrateur
        role = 'admin'
        fields = '__all__'
        
#--------------GESTIONNAIRE-----------------
class GestionnaireSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='gestionnaire', read_only=True)
    
    class Meta:
        model = Gestionnaire
        role = 'gestionnaire'
        fields = '__all__'
        

# -------- CHEF DEPARTEMENT --------
class ChefDepartementSerializer(BaseProfilSerializer):
    role = serializers.CharField(default='chef_dpt', read_only=True)

    class Meta:
        model = ChefDepartement
        role = 'chef_dpt'
        fields = '__all__'


# -------- CONNEXION --------
class ConnexionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connexion
        fields = ['id', 'date_connexion', 'ip', 'statut', 'navigateur', 'resultat']
