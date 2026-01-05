from rest_framework.views import APIView
from rest_framework.response import Response
from apps.inscription_pedagogique.models import Inscription
from apps.utilisateurs.models import Etudiant
from apps.utilisateurs.serializers import EtudiantSerializer
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated


class FiltrerEtudiantsAPIView(APIView):
    #permission_classes = [IsAuthenticated] 

    def get(self, request):
        # Base : tous les étudiants avec leur utilisateur
        queryset = Etudiant.objects.select_related('utilisateur')

        # Récupération des filtres
        departement = request.query_params.get('departement')
        filiere = request.query_params.get('filiere')
        parcours = request.query_params.get('parcours')
        annee_etude = request.query_params.get('annee_etude')
        anneeAcademique = request.query_params.get('anneeAcademique') or request.query_params.get('annee_academique')
        search = request.query_params.get('search')

        # Filtre par département
        if departement and str(departement).lower() not in ['tout', '']:
            queryset = queryset.filter(inscriptions__filiere__departement__id=departement)

        # Filtre par filière
        if filiere and str(filiere).lower() not in ['tout', '']:
            queryset = queryset.filter(inscriptions__filiere__id=filiere)

        # Filtre par parcours
        if parcours and str(parcours).lower() not in ['tout', '']:
            queryset = queryset.filter(inscriptions__parcours__id=parcours)

        # Filtre par année d'étude
        if annee_etude and str(annee_etude).lower() not in ['tout', '']:
            queryset = queryset.filter(inscriptions__annee_etude__id=annee_etude)

        # CORRECTION CLÉ : Filtre par année académique (gère "2024-2025" ou ID)
        if anneeAcademique and str(anneeAcademique).lower() not in ['tout', '', 'null', 'undefined', 'none']:
            if str(anneeAcademique).isdigit():
                queryset = queryset.filter(inscriptions__anneeAcademique__id=int(anneeAcademique))
            else:
                queryset = queryset.filter(inscriptions__anneeAcademique__libelle__iexact=anneeAcademique.strip())

        # Recherche par nom, prénom, carte, etc.
        if search and search.strip():
            terms = search.strip().split()
            q = Q()
            for term in terms:
                q |= (
                    Q(utilisateur__first_name__icontains=term) |
                    Q(utilisateur__last_name__icontains=term) |
                    Q(utilisateur__email__icontains=term) |
                    Q(num_carte__icontains=term) |
                    Q(autre_prenom__icontains=term) |
                    Q(lieu_naiss__icontains=term)
                )
            queryset = queryset.filter(q)

        # Tri
        ordering = request.query_params.get('ordering', 'utilisateur__last_name')
        queryset = queryset.order_by(ordering)

        # Pagination manuelle (plus simple et fiable que DRF Pagination ici)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        etudiants_page = queryset.distinct()[start:end]

        serializer = EtudiantSerializer(etudiants_page, many=True)

        return Response({
            'count': total,
            'results': serializer.data,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        })


# Vue bonus : étudiants inscrits à une UE
class EtudiantsParUEView(APIView):
    #permission_classes = [IsAuthenticated]

    def get(self, request, ue_id):
        inscriptions = Inscription.objects.filter(ues__id=ue_id)
        if not inscriptions.exists():
            return Response({"detail": "Aucune inscription trouvée pour cette UE."}, status=404)

        etudiants = Etudiant.objects.filter(
            id__in=inscriptions.values_list('etudiant_id', flat=True)
        ).select_related('utilisateur').distinct()

        serializer = EtudiantSerializer(etudiants, many=True)
        return Response(serializer.data)