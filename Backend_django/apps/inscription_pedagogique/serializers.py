
from rest_framework import serializers
from .models import AnneeAcademique, AnneeEtude, Filiere,  Parcours, Etablissement, Departement, Inscription, PeriodeInscription, Semestre
from apps.page_professeur.models import UE
from apps.utilisateurs.models import Etudiant, RespInscription


class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    inscriptions = serializers.PrimaryKeyRelatedField(queryset=Inscription.objects.all(),many=True,required=False)
    class Meta:
        model = AnneeAcademique
        fields = '__all__'

class SemestreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semestre
        fields = '__all__'

class AnneeEtudeSerializer(serializers.ModelSerializer):
    inscriptions = serializers.PrimaryKeyRelatedField(queryset=Inscription.objects.all(),many=True, required=False)
    semestre = serializers.PrimaryKeyRelatedField(queryset=Semestre.objects.all(), many=True, required=True)
    class Meta:
        model = AnneeEtude
        fields = '__all__'

class FiliereSerializer(serializers.ModelSerializer):
    departement = serializers.PrimaryKeyRelatedField(queryset=Departement.objects.all(),required=True)
    inscriptions = serializers.PrimaryKeyRelatedField(queryset=Inscription.objects.all(),many=True, required=False)
    parcours = serializers.PrimaryKeyRelatedField(queryset=Parcours.objects.all(),many=True, required=True)
    class Meta:
        model = Filiere
        fields = '__all__'

class ParcoursSerializer(serializers.ModelSerializer):
    inscriptions = serializers.PrimaryKeyRelatedField(queryset=Inscription.objects.all(),many=True, required=False)
    class Meta:
        model = Parcours
        fields = '__all__'

class EtablissementSerializer(serializers.ModelSerializer):
    departements = serializers.PrimaryKeyRelatedField(queryset=Departement.objects.all(), many=True)
    class Meta:
        model = Etablissement
        fields = '__all__'

class DepartementSerializer(serializers.ModelSerializer):
    etablissement = serializers.PrimaryKeyRelatedField(queryset=Etablissement.objects.all(), required=True)
    filieres = serializers.PrimaryKeyRelatedField(queryset=Filiere.objects.all(), many=True, required=False)
    class Meta:
        model = Departement
        fields = '__all__'

class InscriptionSerializer(serializers.ModelSerializer):
    etudiant = serializers.PrimaryKeyRelatedField(queryset=Etudiant.objects.all(), required=True)
    parcours = serializers.PrimaryKeyRelatedField(queryset=Parcours.objects.all(), required=True)
    annee_etude = serializers.PrimaryKeyRelatedField(queryset=AnneeEtude.objects.all(), required=True)
    filiere = serializers.PrimaryKeyRelatedField(queryset=Filiere.objects.all(), required=True)
    anneeAcademique = serializers.PrimaryKeyRelatedField(queryset=AnneeAcademique.objects.all(), required=True)
    ues = serializers.PrimaryKeyRelatedField(queryset=UE.objects.all(), many=True, required=True)
    class Meta:
        model = Inscription
        fields = '__all__'

class PeriodeInscriptionSerializer(serializers.ModelSerializer):
    responsable = serializers.PrimaryKeyRelatedField(queryset=RespInscription.objects.all(), required=True)
    class Meta:
        model = PeriodeInscription
        fields = '__all__'
        
