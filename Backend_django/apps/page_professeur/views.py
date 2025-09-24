from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from .models import UE, AffectationUe, Evaluation, Note, Projet, Recherche, Article, Encadrement,PeriodeSaisie
from apps.authentification.permissions import IsAdminOrRespNotesOnly, IsProfesseur, IsResponsableNotes, IsOwnerOrReadOnlyForProf
from .serializers import UESerializer,AffectationUeSerializer, EvaluationSerializer, NoteSerializer, ProjetSerializer, RechercheSerializer, ArticleSerializer, EncadrementSerializer, PeriodeSaisieSerializer
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
    # Création , modification , suppression , seulement Responsable de notes
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
            ue = self.get_object()  # récupère l'UE en fonction de pk
            evaluations = ue.evaluations.all()  # grâce au related_name="evaluations"
            serializer = EvaluationSerializer(evaluations, many=True)
            return Response(serializer.data)
        except UE.DoesNotExist:
            return Response({"error": "UE introuvable"}, status=404)
        
    # nouvelle action pour récupérer les notes
    @action(detail=True, methods=["get"])
    def notes(self, request, pk=None):
        """
        Récupère toutes les évaluations d’une UE, les étudiants inscrits,
        et les notes correspondantes.
        """
        ue = self.get_object()

        # toutes les évaluations liées à cette UE (ex: devoir, examen, projet…)
        evaluations = Evaluation.objects.filter(ue=ue)

        # tous les étudiants inscrits à cette UE
        etudiants = Etudiant.objects.filter(inscriptions__ues=ue).distinct()

        # construire la réponse JSON
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
        Récupérer les UEs filtrées par parcours, filière et année d’étude.
        Exemple d’URL :
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
        # Lier le projet au professeur connecté
        serializer.save(professeur=self.request.user.professeur)
    
    # Nouvelle méthode pour récupérer les projets d'un prof par son id
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
    
    # Nouvelle méthode pour récupérer les recherches d'un prof par son id
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
    # Nouvelle méthode pour récupérer les articles d'un prof par son id
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
    # Nouvelle méthode pour récupérer les encadrements d'un prof par son id
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
