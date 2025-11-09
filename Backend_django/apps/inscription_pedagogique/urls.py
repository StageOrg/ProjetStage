from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inscription_pedagogique.views.apiviews.inscription_admin.import_anciens_etudiants import import_anciens_etudiants
from apps.inscription_pedagogique.views.apiviews.stats_views import StatistiquesInscriptionsAPIView
from .views.viewset.views import (
    AnneeAcademiqueViewSet, 
    AnneeEtudeViewSet, 
    FiliereViewSet, 
    ParcoursViewSet, 
    EtablissementViewSet, 
    DepartementViewSet, 
    InscriptionViewSet, 
    PeriodeInscriptionViewSet,
    SemestreViewSet,
    check_annee_etude,
    inscription_ancien_etudiant,
    verifier_ancien_etudiant,  
)

from .views.apiviews.parcours_relations_view import parcours_avec_relations
from .views.apiviews.inscriptions_filtre_view import FiltrerEtudiantsAPIView, EtudiantsParUEView 
from .views.apiviews.inscription_admin.inscription import InscriptionEtudiantView
from .views.apiviews.inscription_admin.set_password import SetPasswordView


# === ROUTER ===
router = DefaultRouter()
router.register(r'annee-academique', AnneeAcademiqueViewSet)
router.register(r'annee-etude', AnneeEtudeViewSet)
router.register(r'filiere', FiliereViewSet)
router.register(r'parcours', ParcoursViewSet)
router.register(r'etablissement', EtablissementViewSet)
router.register(r'departement', DepartementViewSet)
router.register(r'inscription', InscriptionViewSet)
router.register(r'periode-inscription', PeriodeInscriptionViewSet)
router.register(r'semestre', SemestreViewSet)

# === URLS ===
urlpatterns = [
    path('', include(router.urls)),

    # Filtres & Stats
    path('etudiants/filtrer/', FiltrerEtudiantsAPIView.as_view(), name='filtrer_etudiants'), 
    path('etudiants/ue/<int:ue_id>/', EtudiantsParUEView.as_view(), name='etudiants_par_ue'),
    path('parcours-relations/', parcours_avec_relations, name='parcours-relations'),
    path('stats/', StatistiquesInscriptionsAPIView.as_view(), name='statistiques-inscriptions'),

    # Réinscription ancien étudiant
    path('verifier-ancien-etudiant/<str:num_carte>/', verifier_ancien_etudiant, name='verifier_ancien_etudiant'),
    path('ancien-etudiant/', inscription_ancien_etudiant, name='inscription_ancien_etudiant'),
    path('inscription/check-annee-etude/', check_annee_etude, name='check-annee-etude'),

    # === INSCRIPTION PAR RESPONSABLE ===
    path('inscription/import-anciens-etudiants/', import_anciens_etudiants, name='import_anciens_etudiants'),    path('inscrire-etudiant/', InscriptionEtudiantView.as_view(), name='inscrire_etudiant'),
    path('set-password/', SetPasswordView.as_view(), name='set-password'),
    
]