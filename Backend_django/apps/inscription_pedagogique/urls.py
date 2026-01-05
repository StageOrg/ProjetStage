# apps/inscription_pedagogique/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.inscription_pedagogique.views.apiviews.get_ue_multiniveau import get_ues_multi_niveaux

from .views.apiviews.update_profil_etudiant import update_profil_etudiant, inscription_nouveau_etudiant
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
    verifier_inscription_en_cours,
)

# Autres vues
from apps.inscription_pedagogique.views.apiviews.inscription_admin.renvoyer_identifiants import RenvoyerIdentifiantsView
from apps.inscription_pedagogique.views.apiviews.inscription_admin.creer_compte_etudiant import CreerCompteEtudiantView
from apps.inscription_pedagogique.views.apiviews.statistique_evolution import StatistiquesEvolutionAPIView
from apps.inscription_pedagogique.views.apiviews.inscription_admin.historique import HistoriqueOperationsView, enregistrer_suppression
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
    path('ues/multi-niveaux/',get_ues_multi_niveaux, name='ues-multi-niveaux'),
    # STATS
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

    # Détails inscription
    path('etudiants/<int:etudiant_id>/inscriptions/', get_inscriptions_etudiant, name='etudiant-inscriptions'),
    path('inscriptions/<int:inscription_id>/ues/', get_ues_inscription, name='inscription-ues'),
    path('inscriptions/<int:inscription_id>/detail/', get_inscription_detail, name='inscription-detail'),

    # Historique & suppression
    path('historique-operations/', HistoriqueOperationsView.as_view(), name='historique_operations'),
    path('enregistrer-suppression/', enregistrer_suppression, name='enregistrer_suppression'),

    # Création de compte étudiant (responsable)
    path('creer-compte-etudiant/', CreerCompteEtudiantView.as_view(), name='creer-compte-etudiant'),
    path('renvoyer-identifiants/', RenvoyerIdentifiantsView.as_view(), name='renvoyer-identifiants'),

    path('verifier-inscription/<int:etudiant_id>/', verifier_inscription_en_cours, name='verifier-inscription-en-cours'),
    path('update-profil/', update_profil_etudiant, name='update-profil-etudiant'),
    path('nouveau/', inscription_nouveau_etudiant, name='inscription-nouveau'),
]