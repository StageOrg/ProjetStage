
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from apps.utilisateurs.views import (
   UtilisateurViewSet, AdministrateurViewSet, ConnexionViewSet, ProfesseurViewSet, EtudiantViewSet,
    RespInscriptionViewSet, ResponsableSaisieNoteViewSet, SecretaireViewSet, check_num_carte,
    RespInscriptionViewSet, ResponsableSaisieNoteViewSet, SecretaireViewSet, GestionnaireViewSet, ChefDepartementViewSet
)

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'etudiants', EtudiantViewSet)
router.register(r'professeurs', ProfesseurViewSet)
router.register(r'secretaires', SecretaireViewSet)
router.register(r'responsables-inscription', RespInscriptionViewSet)
router.register(r'responsables-notes', ResponsableSaisieNoteViewSet)
router.register(r'administrateurs', AdministrateurViewSet)
router.register(r'gestionnaires', GestionnaireViewSet)
router.register(r'connexions', ConnexionViewSet)
router.register(r'chefs-departement', ChefDepartementViewSet)

urlpatterns = [
    path('', include(router.urls)),
      # Ajouter l'endpoint pour les UEs avec notes
    path('etudiants/mes-ues-avec-notes/', views.etudiant_mes_ues_avec_notes, name='etudiant-mes-ues-avec-notes'),
    path('check-num-carte/', check_num_carte, name='check-num-carte'),
]
