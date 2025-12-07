from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.inscription_pedagogique.models import Inscription
from apps.page_professeur.models import Projet, Recherche, Article, Encadrement, Note
from apps.page_professeur.serializers import AffectationUeSerializer, NoteSerializer
from .models import (
    JournalAction, Utilisateur, Etudiant, Professeur, Administrateur,
    RespInscription, ResponsableSaisieNote, Secretaire, Gestionnaire, ChefDepartement
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
# Dans apps/utilisateurs/serializers.py - Version complètement corrigée

class EtudiantSerializer(serializers.ModelSerializer):
    # Informations utilisateur (accessibles directement)
    email = serializers.EmailField(source='utilisateur.email', read_only=False)
    username = serializers.CharField(source='utilisateur.username', read_only=True)
    first_name = serializers.CharField(source='utilisateur.first_name', read_only=False)  
    last_name = serializers.CharField(source='utilisateur.last_name', read_only=False)   
    telephone = serializers.CharField(source='utilisateur.telephone', read_only=False, allow_blank=True, allow_null=True)    
    sexe = serializers.CharField(source='utilisateur.sexe', read_only=False, allow_blank=True)               
    role = serializers.CharField(source='utilisateur.role', read_only=True)
    num_carte = serializers.IntegerField(required=False,allow_null=True,read_only=False)
    date_naiss = serializers.DateField(read_only=False, allow_null=True)
    lieu_naiss = serializers.CharField(read_only=False, allow_blank=True, allow_null=True)
    autre_prenom = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    photo = serializers.ImageField(required=False, allow_null=True)
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
        inscription = obj.inscriptions.order_by('-anneeAcademique__libelle', '-date').first()
        if inscription and inscription.parcours:
            return {
                'id': inscription.parcours.id,
                'libelle': inscription.parcours.libelle,
                'abbreviation': inscription.parcours.abbreviation,   # ← AJOUTÉ
            }
        return None

    def get_filiere_info(self, obj):
        inscription = obj.inscriptions.order_by('-anneeAcademique__libelle', '-date').first()
        if inscription and inscription.filiere:
            return {
                'id': inscription.filiere.id,
                'nom': inscription.filiere.nom,
                'abbreviation': inscription.filiere.abbreviation,   # ← AJOUTÉ
            }
        return None

    def get_annee_etude_info(self, obj):
        inscription = obj.inscriptions.order_by('-anneeAcademique__libelle', '-date').first()
        if inscription and inscription.annee_etude:
            return {
                'id': inscription.annee_etude.id,
                'libelle': inscription.annee_etude.libelle,
            }
        return None

    def validate_num_carte(self, value):
        """
        Gère les valeurs vides ET vérifie l'unicité
        Le numéro doit contenir exactement 6 chiffres
        """
        # Si vide/null/
        if value in [None, '', ' ']:
            return None
        
        # Si c'est une chaîne, la convertir en int
        if isinstance(value, str):
            value = value.strip()
            if value == '':
                return None
            try:
                value = int(value)
            except ValueError:
                raise serializers.ValidationError(
                    "Le numéro de carte doit contenir uniquement des chiffres"
                )
        
        if value < 100000 or value > 999999:
            raise serializers.ValidationError(
                "Le numéro de carte doit contenir exactement 6 chiffres"
            )
        
        # Vérifier l'unicité
        queryset = Etudiant.objects.filter(num_carte=value)
        
        # Si mise à jour, exclure l'étudiant actuel
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError(
                "Ce numéro de carte est déjà utilisé par un autre étudiant"
            )
        
        return value

    def update(self, instance, validated_data):
        """
        Méthode de mise à jour corrigée qui gère correctement 
        les champs avec source='utilisateur.*'
        """
        # Extraire les données utilisateur si elles existent
        utilisateur_data = validated_data.pop('utilisateur', None)
        
        # Mettre à jour l'utilisateur associé si nécessaire
        if utilisateur_data:
            utilisateur = instance.utilisateur
            for attr, value in utilisateur_data.items():
                setattr(utilisateur, attr, value)
            utilisateur.save()
        
        # Mettre à jour les champs spécifiques à l'étudiant
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
        representation['num_carte'] = instance.num_carte if instance.num_carte else None
        
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


# -------- RESPONSABLE SAISIENOTE --------
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


# -------- Journal  --------
class JournalActionSerializer(serializers.ModelSerializer):
    utilisateur = serializers.StringRelatedField()
    class Meta:
        model = JournalAction
        fields = "__all__"