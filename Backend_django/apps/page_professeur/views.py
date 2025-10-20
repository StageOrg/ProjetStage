# apps/page_professeur/views.py

from django.shortcuts import render
from rest_framework import viewsets, status
from apps.page_professeur.services import calculer_validation_ue, obtenir_resultats_etudiant, obtenir_ues_validees, calculer_tous_resultats_ue
from apps.inscription_pedagogique.models import Inscription
from .models import UE, AffectationUe, Evaluation, Note, Projet, Recherche, Article, Encadrement, PeriodeSaisie, ResultatUE
from apps.authentification.permissions import IsAdminOrRespNotesOnly, IsProfesseur
from .serializers import (
    UESerializer, AffectationUeSerializer, EvaluationSerializer, NoteSerializer, 
    ProjetSerializer, RechercheSerializer, ArticleSerializer, EncadrementSerializer, 
    PeriodeSaisieSerializer, ResultatUESerializer
)
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions
from apps.utilisateurs.models import Professeur, Etudiant
from apps.utilisateurs.serializers import EtudiantSerializer
from rest_framework.decorators import action
from rest_framework.response import Response


class UEViewSet(viewsets.ModelViewSet):
    queryset = UE.objects.all().order_by('code')
    serializer_class = UESerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parcours', 'filiere', 'annee_etude', 'semestre']

    def get_permissions(self):
        # Création, modification, suppression, seulement Responsable de notes
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminOrRespNotesOnly()]
    
        # Accès spécial pour les professeurs (ils ne voient que leurs UEs)
        if self.action in ['list', 'partial_update']:
            if hasattr(self.request.user, 'professeur'):
                prof = self.request.user.professeur
                ues = prof.ues.all().values_list('id', flat=True)
                self.queryset = UE.objects.filter(id__in=ues)
                return [IsProfesseur()]
            return [IsAdminOrRespNotesOnly()]
    
        # Lecture ouverte (exemple: filtrage, récupération publique des UEs)
        if self.action in ['retrieve', 'filtrer']:
            return [permissions.AllowAny()]
    
        # Authentification par défaut pour le reste
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrage optionnel pour les professeurs
        if hasattr(self.request.user, 'professeur'):
            return queryset.filter(professeurs=self.request.user.professeur)
        
        return queryset
        
    # Récupération des étudiants inscrits à une UE donnée
    @action(detail=True, methods=['get'])
    def etudiantsInscrits(self, request, pk=None):
        ue = self.get_object()
        etudiantsInscrits = Etudiant.objects.filter(inscriptions__ues=ue)
        serializer = EtudiantSerializer(etudiantsInscrits, many=True)
        return Response(serializer.data)
    
    # Récupérer toutes les évaluations liées à une UE donnée
    @action(detail=True, methods=['get'], url_path='evaluations')
    def get_evaluations(self, request, pk=None):
        try:
            ue = self.get_object()
            evaluations = ue.evaluations.all()
            serializer = EvaluationSerializer(evaluations, many=True)
            return Response(serializer.data)
        except UE.DoesNotExist:
            return Response({"error": "UE introuvable"}, status=404)
        
    # Nouvelle action pour récupérer les notes
    @action(detail=True, methods=["get"])
    def notes(self, request, pk=None):
        """
        Récupère toutes les évaluations d'une UE, les étudiants inscrits,
        et les notes correspondantes.
        """
        ue = self.get_object()

        # Toutes les évaluations liées à cette UE
        evaluations = Evaluation.objects.filter(ue=ue)

        # Tous les étudiants inscrits à cette UE
        etudiants = Etudiant.objects.filter(inscriptions__ues=ue).distinct()

        # Construire la réponse JSON
        data = {
            "evaluations": [
                {"id": ev.id, "type": ev.type, "poids": ev.poids}
                for ev in evaluations
            ],
            "etudiants": []
        }

        for etu in etudiants:
            notes_dict = {}
            for ev in evaluations:
                note_obj = Note.objects.filter(etudiant=etu, evaluation=ev).first()
                notes_dict[str(ev.id)] = note_obj.note if note_obj else None

            data["etudiants"].append({
                "id": etu.id,
                "nom": etu.utilisateur.last_name,
                "prenom": etu.utilisateur.first_name,
                "num_carte": etu.num_carte,
                "sexe": etu.utilisateur.sexe,
                "notes": notes_dict,
            })

        return Response(data)
        
    @action(detail=False, methods=['get'], url_path='filtrer')
    def filtrer(self, request):
        """
        Récupérer les UEs filtrées par parcours, filière et année d'étude.
        Exemple d'URL :
        GET /notes/ues/filtrer/?parcours=1&filiere=2&annee_etude=3
        """
        parcours_id = request.query_params.get('parcours')
        filiere_id = request.query_params.get('filiere')
        annee_id = request.query_params.get('annee_etude')

        queryset = UE.objects.all()

        if parcours_id:
            queryset = queryset.filter(parcours__id=parcours_id)
        if filiere_id:
            queryset = queryset.filter(filiere__id=filiere_id)
        if annee_id:
            queryset = queryset.filter(annee_etude__id=annee_id)

        serializer = UESerializer(queryset.distinct(), many=True)
        return Response(serializer.data)
    
    # NOUVELLE ACTION : Calculer les résultats (BIEN INDENTÉ dans la classe)
    @action(detail=True, methods=['post'], url_path='calculer-resultats')
    def calculer_resultats(self, request, pk=None):
        """
        Calcule les résultats de tous les étudiants pour cette UE
        URL: POST /notes/ues/{id}/calculer-resultats/
        """
        ue = self.get_object()
        
        try:
            resultats = calculer_tous_resultats_ue(ue)
            return Response({
                'success': True,
                'message': f"Résultats calculés pour l'UE {ue.code}",
                'details': resultats
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f"Erreur lors du calcul des résultats: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # NOUVELLE ACTION : Obtenir les résultats d'une UE
    @action(detail=True, methods=['get'], url_path='resultats')
    def get_resultats(self, request, pk=None):
        """
        Récupère tous les résultats des étudiants pour cette UE
        URL: GET /notes/ues/{id}/resultats/
        """
        ue = self.get_object()
        
        resultats = ResultatUE.objects.filter(ue=ue).select_related('etudiant', 'etudiant__utilisateur')
        serializer = ResultatUESerializer(resultats, many=True)
        
        return Response({
            'ue': {
                'id': ue.id,
                'code': ue.code,
                'libelle': ue.libelle,
                'composite': ue.composite
            },
            'resultats': serializer.data
        })


class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer


class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer

    def get_queryset(self):
        return Projet.objects.filter(professeur=self.request.user.professeur)
    
    def perform_create(self, serializer):
        serializer.save(professeur=self.request.user.professeur)
    
    @action(detail=False, methods=['get'], url_path='par-professeur/(?P<prof_id>[^/.]+)')
    def projets_par_professeur(self, request, prof_id=None):
        projets = Projet.objects.filter(professeur__id=prof_id)
        serializer = self.get_serializer(projets, many=True)
        return Response(serializer.data)


class RechercheViewSet(viewsets.ModelViewSet):
    queryset = Recherche.objects.all()
    serializer_class = RechercheSerializer

    def get_queryset(self):
        return Recherche.objects.filter(professeur=self.request.user.professeur)

    def perform_create(self, serializer):
        serializer.save(professeur=self.request.user.professeur)
    
    @action(detail=False, methods=['get'], url_path='par-professeur/(?P<prof_id>[^/.]+)')
    def recherches_par_professeur(self, request, prof_id=None):
        recherches = Recherche.objects.filter(professeur__id=prof_id)
        serializer = self.get_serializer(recherches, many=True)
        return Response(serializer.data)


class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer

    def get_queryset(self):
        return Article.objects.filter(professeur=self.request.user.professeur)
    
    def perform_create(self, serializer):
        serializer.save(professeur=self.request.user.professeur)
    
    @action(detail=False, methods=['get'], url_path='par-professeur/(?P<prof_id>[^/.]+)')
    def articles_par_professeur(self, request, prof_id=None):
        articles = Article.objects.filter(professeur__id=prof_id)
        serializer = self.get_serializer(articles, many=True)
        return Response(serializer.data)


class EncadrementViewSet(viewsets.ModelViewSet):
    queryset = Encadrement.objects.all()
    serializer_class = EncadrementSerializer
    
    def get_queryset(self):
        return Encadrement.objects.filter(professeur=self.request.user.professeur)
    
    def perform_create(self, serializer):
        serializer.save(professeur=self.request.user.professeur)
    
    @action(detail=False, methods=['get'], url_path='par-professeur/(?P<prof_id>[^/.]+)')
    def encadrements_par_professeur(self, request, prof_id=None):
        encadrements = Encadrement.objects.filter(professeur__id=prof_id)
        serializer = self.get_serializer(encadrements, many=True)
        return Response(serializer.data)


class PeriodeSaisieViewSet(viewsets.ModelViewSet):
    queryset = PeriodeSaisie.objects.all()
    serializer_class = PeriodeSaisieSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return PeriodeSaisie.objects.all()
        elif hasattr(user, 'resp_notes'):
            return PeriodeSaisie.objects.filter(responsable=user.resp_notes)
        return PeriodeSaisie.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'resp_notes'):
            serializer.save(responsable=user.resp_notes)
        elif user.is_superuser:
            responsable = self.request.data.get('responsable')
            serializer.save(responsable_id=responsable)
        else:
            raise PermissionError("Tu n'as pas le droit de créer une période.")


class AffectationUeViewSet(viewsets.ModelViewSet):
    queryset = AffectationUe.objects.all()
    serializer_class = AffectationUeSerializer
    permission_classes = [IsAdminOrRespNotesOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAdminOrRespNotesOnly()]
        elif self.action == 'list':
            if hasattr(self.request.user, 'professeur'):
                return [IsProfesseur()]
            return [IsAdminOrRespNotesOnly()]
        return super().get_permissions()
        
 
#  ResultatUE
class ResultatUEViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les résultats d'UEs
    Les résultats sont créés/mis à jour via les services
    """
    queryset = ResultatUE.objects.all().select_related('etudiant', 'ue', 'inscription')
    serializer_class = ResultatUESerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etudiant', 'ue', 'inscription', 'est_valide']
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='par-etudiant/(?P<etudiant_id>[^/.]+)')
    def par_etudiant(self, request, etudiant_id=None):
        """
        Récupère tous les résultats d'un étudiant
        URL: GET /notes/resultats/par-etudiant/{etudiant_id}/
        """
        try:
            etudiant = Etudiant.objects.get(id=etudiant_id)
            resultats = obtenir_resultats_etudiant(etudiant)
            serializer = self.get_serializer(resultats, many=True)
            
            # Calculer les totaux
            total_credits_obtenus = sum(r.credits_obtenus for r in resultats)
            ues_validees = resultats.filter(est_valide=True).count()
            ues_totales = resultats.count()
            
            return Response({
                'etudiant': {
                    'id': etudiant.id,
                    'num_carte': etudiant.num_carte,
                    'nom': etudiant.utilisateur.get_full_name()
                },
                'statistiques': {
                    'ues_validees': ues_validees,
                    'ues_totales': ues_totales,
                    'total_credits_obtenus': total_credits_obtenus
                },
                'resultats': serializer.data
            })
        except Etudiant.DoesNotExist:
            return Response({'error': "Étudiant non trouvé"}, status=404)
       