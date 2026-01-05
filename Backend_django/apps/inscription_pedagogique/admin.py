
# Register your models here.
from django.contrib import admin
from .models import AnneeAcademique, AnneeEtude, Filiere, Parcours, Etablissement, Departement, Inscription, PeriodeInscription, Semestre

admin.site.register(AnneeAcademique)
admin.site.register(AnneeEtude)
admin.site.register(Filiere)
admin.site.register(Parcours)
admin.site.register(Etablissement)
admin.site.register(Departement)
admin.site.register(Inscription)
admin.site.register(PeriodeInscription)
admin.site.register(Semestre)
