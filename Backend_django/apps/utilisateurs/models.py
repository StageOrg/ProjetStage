from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.password_validation  import validate_password
from django.core.validators import MaxValueValidator
from ..utilisateurs.managers import UtilisateurManager

class Utilisateur(AbstractUser):
    ROLES = [
        ('etudiant', 'Etudiant'),
        ('professeur', 'Professeur'),
        ('admin', 'Administrateur'),
        ('resp_notes', 'Responsable des notes'),
        ('resp_inscription', 'Responsable des inscriptions'),
        ('secretaire', 'Secrétaire'),
        ('gestionnaire', 'Gestionnaire'),
        ('chef_dpt', 'Chef de département'),
    ]
    SEXE = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    sexe = models.CharField(max_length=1, choices=SEXE)
    role = models.CharField(max_length=30, choices=ROLES) 
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    doit_changer_mdp = models.BooleanField(default=False)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['role','email']
    

    # Lien vers le manager
    #objects = UtilisateurManager()
    
    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_etudiant(self):
        return hasattr(self, 'etudiant')

    @property
    def is_professeur(self):
        return hasattr(self, 'professeur')

    @property
    def is_secretaire(self):
        return hasattr(self, 'secretaire')

    @property
    def is_resp_notes(self):
        return hasattr(self, 'resp_notes')

    @property
    def is_resp_inscription(self):
        return hasattr(self, 'resp_inscription')

    @property
    def is_admin_personnalise(self):
        return hasattr(self, 'admin')
    @property
    def is_gestionnaire(self):
        return hasattr(self, 'gestionnaire')
    @property
    def is_chef_dpt(self):
        return hasattr(self, 'chef_dpt')


# -----------------------------
# Profils utilisateurs
# -----------------------------

class Etudiant(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="etudiant")
    num_carte = models.PositiveIntegerField(unique=True, null=True, blank=True, validators=[MaxValueValidator(999999)])  
    autre_prenom = models.CharField(max_length=50, null =True)
    photo = models.ImageField(upload_to='photos_etudiants/', null=True,blank=True)
    date_naiss = models.DateField()
    lieu_naiss = models.CharField(max_length=100)
    is_validated = models.BooleanField(default=False)
    evaluations = models.ManyToManyField('page_professeur.Evaluation', through='page_professeur.Note', blank=True)

class Professeur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="professeur")
    titre = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to='photos_profils/', null=True,blank=True)
    ues = models.ManyToManyField('page_professeur.UE', through='page_professeur.AffectationUe', blank=True)
   
class Administrateur(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="admin")

class RespInscription(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="resp_inscription")

class ResponsableSaisieNote(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="resp_notes")

class Secretaire(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="secretaire")

class Gestionnaire(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="gestionnaire")

class ChefDepartement(models.Model):
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name="chef_dpt")

class JournalAction(models.Model):
    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actions"
    )

    action = models.CharField(max_length=255)
    objet = models.CharField(max_length=255, blank=True, null=True)

    date_action = models.DateTimeField(auto_now_add=True)

    ip = models.GenericIPAddressField(null=True, blank=True)

    statut = models.CharField(
        max_length=20,
        choices=[
            ('SUCCES', 'Succès'),
            ('ECHEC', 'Échec')
        ],
        default='SUCCES'
    )

    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.utilisateur} - {self.action} - {self.date_action}"

