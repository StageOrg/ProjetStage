from django.contrib import admin

# Register your models here.
from .models import Utilisateur, Professeur, Etudiant, Administrateur, RespInscription, ResponsableSaisieNote, Secretaire,Gestionnaire, JournalAction

admin.site.register(Utilisateur)
admin.site.register(Professeur)
admin.site.register(Etudiant)
admin.site.register(Administrateur)
admin.site.register(RespInscription)
admin.site.register(ResponsableSaisieNote)
admin.site.register(Secretaire)
admin.site.register(Gestionnaire)
admin.site.register(JournalAction)