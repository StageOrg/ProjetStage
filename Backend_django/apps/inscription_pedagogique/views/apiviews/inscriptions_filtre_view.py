from rest_framework.views import APIView
from rest_framework.response import Response
from apps.authentification import permissions
from apps.inscription_pedagogique.models import Inscription
from apps.utilisateurs.models import Etudiant
from apps.utilisateurs.serializers import EtudiantSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q


class FiltrerEtudiantsAPIView(APIView):
    #permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Démarrer avec tous les étudiants
        queryset = Etudiant.objects.select_related('utilisateur').distinct()
        
        # Récupérer les paramètres de filtre
        departement = request.query_params.get('departement')
        filiere = request.query_params.get('filiere')
        parcours = request.query_params.get('parcours')
        annee_etude = request.query_params.get('annee_etude')
        anneeAcademique = request.query_params.get('anneeAcademique')
        search = request.query_params.get('search')
        
        # Filtrer par département via les inscriptions
        if departement and departement.lower() not in ['tout', '']:
            queryset = queryset.filter(
                inscriptions__filiere__departement__id=departement
            ).distinct()

        # Filtrer par filière via les inscriptions
        if filiere and filiere.lower() not in ['tout', '']:
            queryset = queryset.filter(
                inscriptions__filiere__id=filiere
            ).distinct()

        # Filtrer par parcours via les inscriptions
        if parcours and parcours.lower() not in ['tout', '']:
            queryset = queryset.filter(
                inscriptions__parcours__id=parcours
            ).distinct()

        # Filtrer par année d'étude via les inscriptions
        if annee_etude and annee_etude.lower() not in ['tout', '']:
            queryset = queryset.filter(
                inscriptions__annee_etude__id=annee_etude
            ).distinct()

        # Filtrer par année scolaire/académique via les inscriptions
        if anneeAcademique and anneeAcademique.lower() not in ['tout', '']:
            queryset = queryset.filter(
                inscriptions__anneeAcademique__id=anneeAcademique
            ).distinct()
        
        # Recherche 
        if search and search.strip():
            search_query = Q()
            search_terms = search.strip().split()
            
            for term in search_terms:
                search_query |= (
                    Q(utilisateur__first_name__icontains=term) |
                    Q(utilisateur__last_name__icontains=term) |
                    Q(utilisateur__email__icontains=term) |
                    Q(num_carte__icontains=term) |
                    Q(autre_prenom__icontains=term) |
                    Q(lieu_naiss__icontains=term)
                )
            
            queryset = queryset.filter(search_query).distinct()

        # Tri par défaut
        ordering = request.query_params.get('ordering', 'utilisateur__last_name')
        if ordering:
            queryset = queryset.order_by(ordering)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        etudiants_paginated = queryset[start:end]
        
        serializer = EtudiantSerializer(etudiants_paginated, many=True)
        
        return Response({
            'count': total_count,
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })

# Liste des étudiants inscrits à une UE spécifique
class EtudiantsParUEView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ue_id):
        # Toutes les inscriptions contenant cette UE
        inscriptions = Inscription.objects.filter(ues__id=ue_id)
        if not inscriptions.exists():
            return Response({"detail": "Aucune inscription trouvée pour cette UE."}, status=404)
        
        # Extraire les étudiants à partir des inscriptions
        etudiants = Etudiant.objects.filter(
            id__in=inscriptions.values_list('etudiant_id', flat=True)
        ).distinct()

        serializer = EtudiantSerializer(etudiants, many=True)
        return Response(serializer.data)
