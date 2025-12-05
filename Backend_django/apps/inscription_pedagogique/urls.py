# apps/inscription_pedagogique/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.inscription_pedagogique.views.apiviews.statistique_evolution import StatistiquesEvolutionAPIView
from apps.inscription_pedagogique.views.apiviews.inscription_admin.historique import  HistoriqueOperationsView, enregistrer_suppression
from apps.inscription_pedagogique.views.apiviews.inscription_detail_view import (
    get_inscription_detail,
    get_inscriptions_etudiant,
    get_ues_inscription
)
from apps.inscription_pedagogique.views.apiviews.inscription_admin.import_anciens_etudiants import import_anciens_etudiants

from apps.inscription_pedagogique.views.apiviews.stats_views import (
    StatistiquesInscriptionsAPIView,
    StatistiquesAbandonsAPIView 
)

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
    # Router ViewSets
    path('', include(router.urls)),
    
    # Filtres & Stats
    path('etudiants/filtrer/', FiltrerEtudiantsAPIView.as_view(), name='filtrer_etudiants'),
    path('etudiants/ue/<int:ue_id>/', EtudiantsParUEView.as_view(), name='etudiants_par_ue'),
    path('parcours-relations/', parcours_avec_relations, name='parcours-relations'),
    
    # STATS (les deux avec .as_view() car ce sont des classes)
    path('stats/', StatistiquesInscriptionsAPIView.as_view(), name='statistiques-inscriptions'),
    path('stats-abandons/', StatistiquesAbandonsAPIView.as_view(), name='stats-abandons'), 
    path('stats/evolution/', StatistiquesEvolutionAPIView.as_view(), name='stats-evolution'),
    
    # Réinscription ancien étudiant
    path('verifier-ancien-etudiant/<str:num_carte>/', verifier_ancien_etudiant, name='verifier_ancien_etudiant'),
    path('ancien-etudiant/', inscription_ancien_etudiant, name='inscription_ancien_etudiant'),
    path('inscription/check-annee-etude/', check_annee_etude, name='check-annee-etude'),
    
    # Inscription par responsable
    path('inscription/import-anciens-etudiants/', import_anciens_etudiants, name='import_anciens_etudiants'),
    path('inscrire-etudiant/', InscriptionEtudiantView.as_view(), name='inscrire_etudiant'),
    path('set-password/', SetPasswordView.as_view(), name='set-password'),
    
    path('etudiants/<int:etudiant_id>/inscriptions/', get_inscriptions_etudiant, name='etudiant-inscriptions'),
    path('inscriptions/<int:inscription_id>/ues/', get_ues_inscription, name='inscription-ues'),
    path('inscriptions/<int:inscription_id>/detail/', get_inscription_detail, name='inscription-detail'),
    path('historique-operations/', HistoriqueOperationsView.as_view(), name='historique_operations'),
    path('enregistrer-suppression/', enregistrer_suppression, name='enregistrer_suppression'),
]