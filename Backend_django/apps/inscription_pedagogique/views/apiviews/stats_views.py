from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  
from apps.inscription_pedagogique.models import Inscription, Parcours, Filiere, AnneeEtude
from django.db.models import Count
import logging

logger = logging.getLogger(__name__)  # Pour les logs 

class StatistiquesInscriptionsAPIView(APIView):
    #permission_classes = [IsAuthenticated]  
    def get(self, request):
        # Récupérer les filtres (nettoyage des vides)
        parcours = request.query_params.get('parcours')
        filiere = request.query_params.get('filiere')
        annee_etude = request.query_params.get('annee_etude')
        sexe = request.query_params.get('sexe')

        # Récupération des inscriptions avec jointures optimisées
        queryset = Inscription.objects.select_related(
            'etudiant',
            'etudiant__utilisateur', 
            'parcours',
            'filiere',
            'annee_etude'
        )

        # Filtrage (seulement si filtre valide et non vide)
        if parcours and str(parcours).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(parcours__id=parcours)
        if filiere and str(filiere).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(filiere__id=filiere)
        if annee_etude and str(annee_etude).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(annee_etude__id=annee_etude)
        if sexe and str(sexe).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(etudiant__utilisateur__sexe=sexe)  

        logger.info(f"Requête stats avec filtres: parcours={parcours}, sexe={sexe}")  # Debug 

        # Nombre total d'étudiants inscrits (distinct pour éviter doublons)
        total_etudiants = queryset.values('etudiant').distinct().count()

        # Stats par parcours
        stats_parcours = queryset.values(
            'parcours__id',
            'parcours__libelle'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('parcours__libelle')

        # Stats par filière
        stats_filiere = queryset.values(
            'filiere__id',
            'filiere__nom'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('filiere__nom')

        # Stats par sexe 
        stats_sexe = queryset.values(
            'etudiant__utilisateur__sexe',
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('etudiant__utilisateur__sexe')

        # Réponse 
        return Response({
            'total_etudiants': total_etudiants,
            'par_parcours': [
                {
                    'id': item['parcours__id'],
                    'libelle': item['parcours__libelle'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_parcours
            ],
            'par_filiere': [
                {
                    'id': item['filiere__id'],
                    'nom': item['filiere__nom'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_filiere
            ],
            'par_sexe': [
                {
                    'sexe': item['etudiant__utilisateur__sexe'],  # ✅ Chemin correct
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_sexe if item['etudiant__utilisateur__sexe']  # Filtre les None si besoin
            ]
        })