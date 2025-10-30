from django.db import models
from ..utilisateurs.models import Etudiant, RespInscription
from ..page_professeur.models import UE  


class Etablissement(models.Model):
    nom = models.CharField(max_length=100)
    abbreviation = models.CharField(max_length=10)
    
    def __str__(self):
        return self.nom

class Departement(models.Model):
    nom = models.CharField(max_length=100,unique=True)
    abbreviation = models.CharField(max_length=10)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE)
    def __str__(self):
        return self.nom

class Parcours(models.Model):
    libelle = models.CharField(max_length=100, unique=True)
    abbreviation = models.CharField(max_length=10)

    def __str__(self):
        return self.libelle

class Filiere(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    abbreviation = models.CharField(max_length=10)
    departement = models.ForeignKey(Departement, on_delete=models.CASCADE, related_name= 'filieres')
    parcours = models.ManyToManyField(Parcours, related_name='filieres')
    def __str__(self):
        return self.nom

# Migration à créer pour ajouter est_active
class AnneeAcademique(models.Model):
    libelle = models.CharField(max_length=9, unique=True)
    
    def __str__(self):
        return self.libelle

class Semestre (models.Model):
    libelle = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.libelle   

class AnneeEtude(models.Model):
    libelle = models.CharField(max_length=50, unique=True)
    parcours = models.ManyToManyField(Parcours, related_name='annees_etude')
    semestre = models.ManyToManyField(Semestre, related_name='annees_etude')
    def __str__(self):
        return self.libelle
 
class Inscription(models.Model):
    numero = models.CharField(max_length=50)
    date = models.DateTimeField(auto_now_add=True) 
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name = 'inscriptions')
    parcours = models.ForeignKey(Parcours, on_delete=models.CASCADE, related_name = 'inscriptions')
    annee_etude = models.ForeignKey(AnneeEtude, on_delete=models.CASCADE, related_name = 'inscriptions')
    ues = models.ManyToManyField(UE, related_name='inscriptions')
    filiere = models.ForeignKey(Filiere,on_delete = models.CASCADE,  related_name = 'inscriptions')
    anneeAcademique = models.ForeignKey(AnneeAcademique, on_delete = models.CASCADE, related_name = 'inscriptions') 
    
class PeriodeInscription(models.Model):
    numero = models.CharField(max_length=50)
    date_debut = models.DateField()
    date_fin = models.DateField()
    active = models.BooleanField(default=False)
    responsable = models.ForeignKey(RespInscription, on_delete=models.SET_NULL, null=True, related_name = 'periodes_inscription')

