from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.inscription_pedagogique.models import Inscription, Parcours, Filiere, AnneeEtude
from apps.utilisateurs.models import Etudiant
from django.db.models import Count

class StatistiquesInscriptionsAPIView(APIView):
    #permission_classes = [IsAuthenticated]

    def get(self, request):
        # Récupérer les filtres
        parcours = request.query_params.get('parcours')
        filiere = request.query_params.get('filiere')
        annee_etude = request.query_params.get('annee_etude')

        # Base queryset pour les inscriptions
        queryset = Inscription.objects.select_related('etudiant', 'parcours', 'filiere', 'annee_etude')

        # Appliquer les filtres
        if parcours and parcours.lower() not in ['tout', '']:
            queryset = queryset.filter(parcours__id=parcours)
        if filiere and filiere.lower() not in ['tout', '']:
            queryset = queryset.filter(filiere__id=filiere)
        if annee_etude and annee_etude.lower() not in ['tout', '']:
            queryset = queryset.filter(annee_etude__id=annee_etude)

        # Nombre total d'étudiants inscrits (distinct pour éviter les doublons)
        total_etudiants = queryset.values('etudiant').distinct().count()

        # Statistiques par parcours
        stats_parcours = queryset.values(
            'parcours__id', 'parcours__libelle'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('parcours__libelle')

        # Statistiques par filière
        stats_filiere = queryset.values(
            'filiere__id', 'filiere__nom'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('filiere__nom')

        return Response({
            'total_etudiants': total_etudiants,
            'par_parcours': [
                {
                    'id': item['parcours__id'],
                    'libelle': item['parcours__libelle'],
                    'nombre_etudiants': item['nombre_etudiants']
                } for item in stats_parcours
            ],
            'par_filiere': [
                {
                    'id': item['filiere__id'],
                    'nom': item['filiere__nom'],
                    'nombre_etudiants': item['nombre_etudiants']
                } for item in stats_filiere
            ]
        })