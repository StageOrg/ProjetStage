from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.inscription_pedagogique.models import Inscription
from apps.page_professeur.models import Projet, Recherche, Article, Encadrement, Note
from apps.page_professeur.serializers import AffectationUeSerializer, NoteSerializer
from .models import (
    Utilisateur, Etudiant, Professeur, Administrateur,
    RespInscription, ResponsableSaisieNote, Secretaire, Connexion
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
        
class UtilisateurInfoSerializer(serializers.ModelSerializer):
    """Serializer simple pour afficher les infos utilisateur"""
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'sexe', 'telephone']
        
# -------- ETUDIANT --------     

class EtudiantSerializer(serializers.ModelSerializer):
    # Informations utilisateur (accessibles directement)
    email = serializers.EmailField(source='utilisateur.email', read_only=False)
    username = serializers.CharField(source='utilisateur.username', read_only=True)
    first_name = serializers.CharField(source='utilisateur.first_name', read_only=False)  
    last_name = serializers.CharField(source='utilisateur.last_name', read_only=False)   
    telephone = serializers.CharField(source='utilisateur.telephone', read_only=False, allow_blank=True, allow_null=True)    
    sexe = serializers.CharField(source='utilisateur.sexe', read_only=False, allow_blank=True)               
    role = serializers.CharField(source='utilisateur.role', read_only=True)
    
    # Informations étudiant - CORRECTION ICI
    num_carte = serializers.CharField(read_only=True)
    date_naiss = serializers.DateField(read_only=False, allow_null=True)  # Permettre modification
    lieu_naiss = serializers.CharField(read_only=False, allow_blank=True, allow_null=True)  # Permettre modification
    autre_prenom = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    photo = serializers.ImageField(required=False, allow_null=True)  # S'assurer que la photo est incluse
    is_validated = serializers.BooleanField(read_only=True)
    
    # Informations d'inscription (read-only)
    parcours_info = serializers.SerializerMethodField()
    filiere_info = serializers.SerializerMethodField()
    annee_etude_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Etudiant
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'telephone', 'sexe', 'role', 'num_carte', 'date_naiss', 
            'lieu_naiss', 'autre_prenom', 'photo', 'is_validated',
            'parcours_info', 'filiere_info', 'annee_etude_info'
        ]
        
    def get_parcours_info(self, obj):
        inscription = obj.inscriptions.first()
        return inscription.parcours.libelle if inscription and inscription.parcours else None
        
    def get_filiere_info(self, obj):
        inscription = obj.inscriptions.first()
        return inscription.filiere.nom if inscription and inscription.filiere else None
        
    def get_annee_etude_info(self, obj):
        inscription = obj.inscriptions.first()
        return inscription.annee_etude.libelle if inscription and inscription.annee_etude else None

    def update(self, instance, validated_data):
        # Extraire les données utilisateur qui commencent par 'utilisateur.'
        utilisateur_data = {}
        keys_to_remove = []
        
        for key, value in validated_data.items():
            if key.startswith('utilisateur.'):
                field_name = key.replace('utilisateur.', '')
                utilisateur_data[field_name] = value
                keys_to_remove.append(key)
        
        # Supprimer les clés utilisateur de validated_data
        for key in keys_to_remove:
            validated_data.pop(key)
        
        # Mettre à jour l'utilisateur si nécessaire
        if utilisateur_data:
            for attr, value in utilisateur_data.items():
                setattr(instance.utilisateur, attr, value)
            instance.utilisateur.save()
        
        # Mettre à jour l'étudiant
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

    def to_representation(self, instance):
        """S'assurer que les données sont correctement représentées"""
        representation = super().to_representation(instance)
        
        # S'assurer que tous les champs utilisateur sont bien renseignés
        if instance.utilisateur:
            representation['first_name'] = instance.utilisateur.first_name or ''
            representation['last_name'] = instance.utilisateur.last_name or ''
            representation['email'] = instance.utilisateur.email or ''
            representation['telephone'] = instance.utilisateur.telephone or ''
            representation['sexe'] = instance.utilisateur.sexe or ''
        
        # S'assurer que tous les champs étudiant sont bien renseignés
        representation['date_naiss'] = instance.date_naiss.isoformat() if instance.date_naiss else None
        representation['lieu_naiss'] = instance.lieu_naiss or ''
        representation['autre_prenom'] = instance.autre_prenom or ''
        representation['num_carte'] = instance.num_carte or ''
        
        # Gérer la photo
        if instance.photo:
            representation['photo'] = instance.photo.url if hasattr(instance.photo, 'url') else str(instance.photo)
        else:
            representation['photo'] = None
        
        return representation


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


# -------- CONNEXION --------
class ConnexionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connexion
        fields = ['id', 'date_connexion', 'ip', 'statut', 'navigateur', 'resultat']
