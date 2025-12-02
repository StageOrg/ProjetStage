from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .apiView import (
    importUsersFromExcelView,
    excelTemplateDownloadView,
)

from . import views

# Supprimez tous les imports individuels et utilisez seulement views
router = DefaultRouter()
router.register(r'utilisateurs', views.UtilisateurViewSet)
router.register(r'etudiants', views.EtudiantViewSet)
router.register(r'professeurs', views.ProfesseurViewSet)
router.register(r'secretaires', views.SecretaireViewSet)
router.register(r'responsables-inscription', views.RespInscriptionViewSet)
router.register(r'responsables-notes', views.ResponsableSaisieNoteViewSet)
router.register(r'administrateurs', views.AdministrateurViewSet)
router.register(r'gestionnaires', views.GestionnaireViewSet)
router.register(r'connexions', views.ConnexionViewSet)
router.register(r'chefs-departement', views.ChefDepartementViewSet)

urlpatterns = [
    # Routes personnalisées EN PREMIER (très important)
    path('etudiants/mes_ues_avec_notes/', views.etudiant_mes_ues_avec_notes, name='etudiant_mes_ues_avec_notes'),
    path('check-num-carte/', views.check_num_carte, name='check-num-carte'),
    # Import des utilisateurs depuis Excel
    path('utilisateurs/import-excel/', importUsersFromExcelView, name='import-excel'),
    
    # Téléchargement du modèle Excel
    path('utilisateurs/download-template/', excelTemplateDownloadView, name='download-template'),
    
    # Router EN DERNIER
    path('', include(router.urls)),
]