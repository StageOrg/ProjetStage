# apps/utilisateurs/views.py

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status

from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from ..utilisateurs.models import (
    JournalAction, Professeur, Etudiant,
    RespInscription, ResponsableSaisieNote, Secretaire, Gestionnaire, ChefDepartement
)
from apps.utilisateurs.serializers import (
    JournalActionSerializer, ProfesseurSerializer, EtudiantSerializer,
    RespInscriptionSerializer, ResponsableSaisieNoteSerializer, SecretaireSerializer, GestionnaireSerializer, ChefDepartementSerializer
)
from apps.authentification.permissions import IsIntranet, IsSelfOrAdmin, IsAdminOrReadOnly
from rest_framework.permissions import AllowAny
from apps.utilisateurs.models import Utilisateur, Administrateur
from apps.utilisateurs.serializers import (
    UtilisateurSerializer,
    AdministrateurSerializer
)
from apps.page_professeur.serializers import UESerializer
from rest_framework.decorators import api_view, permission_classes

# Imports pour la nouvelle fonction
from apps.inscription_pedagogique.models import Inscription
from apps.page_professeur.models import Evaluation, Note

# ----- UTILISATEUR DE BASE -----
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all().order_by('last_name')
    serializer_class = UtilisateurSerializer
    pagination_class = None

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        utilisateur = request.user
        serializer = self.get_serializer(utilisateur, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)
    

# ----- ETUDIANT -----
# apps/utilisateurs/views.py - Section EtudiantViewSet corrigée

class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all().order_by('utilisateur__last_name')
    serializer_class = EtudiantSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_etudiant:
            return Etudiant.objects.filter(utilisateur=user)
        return super().get_queryset()


    @action(detail=False, methods=['get', 'put'], 
    permission_classes=[IsAuthenticated])
    def me(self, request):
        try:

            # S'assurer que l'utilisateur a bien un profil étudiant
            if not hasattr(request.user, 'etudiant'):
                return Response({"error": "Profil étudiant non trouvé"}, status=404)
                
            instance = request.user.etudiant
            
            if request.method == 'GET':

                # Utiliser select_related pour optimiser les requêtes
                instance = Etudiant.objects.select_related(
                    'utilisateur'
                ).prefetch_related(
                    'inscriptions__parcours', 
                    'inscriptions__filiere', 
                    'inscriptions__annee_etude'
                ).get(pk=instance.pk)
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
                
            elif request.method == 'PUT':

                print(f"Données reçues: {request.data}")  # Debug
                
                # Mise à jour avec le serializer complet
                serializer = self.get_serializer(instance, data=request.data, partial=True)
                
                if serializer.is_valid():
                    print(f"Données validées: {serializer.validated_data}")  # Debug
                    
                    # Sauvegarder les modifications
                    updated_instance = serializer.save()
                    
                    print(f"Instance mise à jour: {updated_instance}")  # Debug
                    
                    # Recharger l'instance avec toutes les relations pour la réponse
                    fresh_instance = Etudiant.objects.select_related(
                        'utilisateur'
                    ).prefetch_related(
                        'inscriptions__parcours', 
                        'inscriptions__filiere', 
                        'inscriptions__annee_etude'
                    ).get(pk=updated_instance.pk)
                    
                    # Retourner les données mises à jour
                    response_serializer = self.get_serializer(fresh_instance)
                    return Response(response_serializer.data, status=200)
                else:
                    print(f"Erreurs de validation: {serializer.errors}")  # Debug
                    return Response(serializer.errors, status=400)
                    
        except Etudiant.DoesNotExist:
            return Response({"error": "Profil étudiant non trouvé"}, status=404)
        except Exception as e:

            print(f"Erreur dans EtudiantViewSet.me: {str(e)}")  # Debug
            import traceback
            print(f"Traceback complet: {traceback.format_exc()}")  # Debug détaillé
            return Response({"error": f"Erreur serveur: {str(e)}"}, status=500)
        
        
    # Recuperer les ues auxquelles l'etudiant connecté est inscrit
    @action(detail=False, methods=['get'])
    def mes_ues(self, request):
        etudiant = request.user.etudiant 
        inscriptions = etudiant.inscriptions.all()
        ues = []
        for inscription in inscriptions:
            ues.extend(inscription.ues.all())
        serializer = UESerializer(ues, many=True)
        return Response(serializer.data)
    
    
# ----- PROFESSEUR -----
class ProfesseurViewSet(viewsets.ModelViewSet):
    queryset = Professeur.objects.all().order_by('utilisateur__last_name')
    serializer_class = ProfesseurSerializer

    pagination_class = None
    #permission_classes = [IsAdminOrReadOnly]
    
   
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_professeur:
            return Professeur.objects.filter(utilisateur=user)
        return super().get_queryset()
    
    # Endpoint pour modifier les information du professeur connecté

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user

        # Vérifier si un professeur existe
        try:
            prof = user.professeur
        except Professeur.DoesNotExist:
            return Response({"detail": "Aucun profil professeur trouvé pour cet utilisateur."}, status=404)

        if request.method == 'PUT':
            serializer = self.get_serializer(prof, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                return Response(serializer.errors, status=400)
        else:
            serializer = self.get_serializer(prof)

        return Response(serializer.data)

    
    # Recuperer un professeur par l'id de l'utilisateur associé
    @action(detail=False, methods=["get"], url_path="by-user/(?P<user_id>[^/.]+)")
    def get_by_user(self, request, user_id=None):
        try:
            professeur = Professeur.objects.get(utilisateur__id=user_id)
        except Professeur.DoesNotExist:
            return Response(
                {"detail": "Aucun professeur associé à cet utilisateur."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.serializer_class(professeur)
        return Response(serializer.data)
    
    #Recuperer un professeur par son id
    @action(detail=False, methods=['get'], url_path='by-id/(?P<prof_id>[^/.]+)')
    def get_by_id(self, request, prof_id=None):
        try:
            professeur = Professeur.objects.get(id=prof_id)
        except Professeur.DoesNotExist:
            return Response(
                {"detail": "Aucun professeur trouvé avec cet ID."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.serializer_class(professeur)
        return Response(serializer.data)
    
    #UEs du professeur connecté
    @action(detail=True, methods=['get'], url_path='ues-prof')
    def mes_ues_id(self, request, pk=None):
        professeur = self.get_object()
        affectations = professeur.affectations.all()
        ues = [aff.ue for aff in affectations]
        serializer = UESerializer(ues, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def mes_ues(self, request):
        professeur = request.user.professeur 
        affectations = professeur.affectations.all()
        ues = [aff.ue for aff in affectations]
        serializer = UESerializer(ues, many=True)
        return Response(serializer.data)

# ----- SECRETAIRE -----
class SecretaireViewSet(viewsets.ModelViewSet):
    queryset = Secretaire.objects.all().order_by('utilisateur__last_name')
    serializer_class = SecretaireSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_secretaire:
            return Secretaire.objects.filter(utilisateur=user)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.secretaire
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)

# ----- RESPONSABLE INSCRIPTION -----
class RespInscriptionViewSet(viewsets.ModelViewSet):
    queryset = RespInscription.objects.all().order_by('utilisateur__last_name')
    serializer_class = RespInscriptionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_resp_inscription:
            return RespInscription.objects.filter(utilisateur=user)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.resp_inscription
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)

# ----- RESPONSABLE SAISIE NOTES -----
class ResponsableSaisieNoteViewSet(viewsets.ModelViewSet):
    queryset = ResponsableSaisieNote.objects.all().order_by('utilisateur__last_name')
    serializer_class = ResponsableSaisieNoteSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_resp_notes:
            return ResponsableSaisieNote.objects.filter(utilisateur=user)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.resp_notes
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)

# ----- ADMINISTRATEUR -----
class AdministrateurViewSet(viewsets.ModelViewSet):
    queryset = Administrateur.objects.all().order_by('utilisateur__last_name')
    serializer_class = AdministrateurSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_admin_personnalise:
            return Administrateur.objects.filter(utilisateur=user)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.admin
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)


#----------------GESTIONNAIRE----------------
class GestionnaireViewSet(viewsets.ModelViewSet):
    queryset = Gestionnaire.objects.all()
    serializer_class = GestionnaireSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_gestionnaire:
            return Gestionnaire.objects.filter(utilisateur=user)
        return super().get_queryset()

    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.gestionnaire
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)

#----- CHEF DEPARTEMENT -----
class ChefDepartementViewSet(viewsets.ModelViewSet):
    queryset = ChefDepartement.objects.all()
    serializer_class = ChefDepartementSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_chef_dpt:
            return ChefDepartement.objects.filter(utilisateur=user)
        return super().get_queryset()
    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.chef_dpt
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)
    
# ----- Journal d'Actions -----
class JournalActionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JournalAction.objects.all().order_by('-date_action')
    serializer_class = JournalActionSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None

        
@api_view(['POST'])
@permission_classes([AllowAny])
def check_num_carte(request):
    """
    Vérifie si un numéro de carte est disponible
    Accepte les valeurs vides (champ optionnel)
    Le numéro doit contenir exactement 6 chiffres
    """
    num_carte = request.data.get('num_carte', '').strip()
   
    # Si vide → disponible (champ optionnel)
    if not num_carte or num_carte == '':
        return Response({
            'existe': False,
            'disponible': True
        })
   
    # Valider le format (exactement 6 chiffres)
    try:
        num_carte_int = int(num_carte)
        if num_carte_int < 100000 or num_carte_int > 999999:
            return Response({
                'erreur': 'Le numéro de carte doit contenir exactement 6 chiffres'
            }, status=400)
    except ValueError:
        return Response({
            'erreur': 'Le numéro de carte doit contenir uniquement des chiffres'
        }, status=400)
   
    # Vérifier l'existence
    existe = Etudiant.objects.filter(num_carte=num_carte_int).exists()
   
    return Response({
        'existe': existe,
        'disponible': not existe
    })

# ----- NOUVELLE FONCTION POUR LES UEs AVEC NOTES -----
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def etudiant_mes_ues_avec_notes(request):
    """
    Endpoint pour qu'un étudiant récupère ses UEs avec notes
    URL: GET /api/utilisateurs/etudiants/mes_ues_avec_notes/
    """
    print("🔍 DEBUG: Fonction etudiant_mes_ues_avec_notes appelée!")
    print(f"🔍 DEBUG: Utilisateur: {request.user}")
    print(f"🔍 DEBUG: Authentifié: {request.user.is_authenticated}")
    print(f"🔍 DEBUG: Est étudiant: {hasattr(request.user, 'etudiant')}")
    
    try:
        if not hasattr(request.user, 'etudiant'):
            return Response({"error": "Accès réservé aux étudiants"}, status=403)
            
        etudiant = request.user.etudiant
        
        # Récupérer toutes les inscriptions de l'étudiant
        inscriptions = Inscription.objects.filter(etudiant=etudiant).select_related(
            'anneeAcademique', 'annee_etude', 'parcours', 'filiere'
        )
        
        if not inscriptions.exists():
            return Response({"message": "Aucune inscription trouvée pour cet étudiant"}, status=200)
        
        result = []
        
        for inscription in inscriptions:
            ues = inscription.ues.all().select_related('semestre')
            
            # Précharger toutes les évaluations et notes d'un coup
            evaluations = Evaluation.objects.filter(ue__in=ues)
            notes = Note.objects.filter(etudiant=etudiant, evaluation__in=evaluations)
            
            # Dictionnaire pour accès rapide aux notes
            notes_dict = {note.evaluation_id: note.note for note in notes}
            
            for ue in ues:
                ue_evaluations = [ev for ev in evaluations if ev.ue_id == ue.id]
                
                notes_par_evaluation = []
                somme_notes_ponderees = 0
                poids_total = 0
                moyenne_ue = None
                has_notes = False
                
                for ev in ue_evaluations:
                    note_value = notes_dict.get(ev.id)
                    
                    notes_par_evaluation.append({
                        'id': ev.id,
                        'type': ev.type,
                        'poids': ev.poids,
                        'note': note_value,
                    })
                    
                    if note_value is not None:
                        somme_notes_ponderees += note_value * ev.poids
                        poids_total += ev.poids
                        has_notes = True
                
                if poids_total > 0 and has_notes:
                    moyenne_ue = round(somme_notes_ponderees / poids_total, 2)
                
                statut = "Validé" if (moyenne_ue and moyenne_ue >= 10) else "Non validé" if moyenne_ue else "En cours"
                
                result.append({
                    'id': ue.id,
                    'code': ue.code,
                    'libelle': ue.libelle,
                    'credits': ue.nbre_credit,
                    'credit_valide': ue.nbre_credit if (moyenne_ue and moyenne_ue >= 10) else 0,
                    'composite': ue.composite,
                    'description': ue.description or "",
                    'semestre': ue.semestre.libelle if ue.semestre else "Non spécifié",
                    'notes': notes_par_evaluation,
                    'moyenne': moyenne_ue,
                    'statut': statut,
                    # CORRECTION : Vérifiez les noms d'attributs réels
                    'parcours': getattr(inscription.parcours, 'nom', 
                                       getattr(inscription.parcours, 'libelle', 
                                              getattr(inscription.parcours, 'name', None))),
                    'filiere': getattr(inscription.filiere, 'nom', 
                                     getattr(inscription.filiere, 'libelle', 
                                            getattr(inscription.filiere, 'name', None))),
                    'annee_etude': getattr(inscription.annee_etude, 'nom', 
                                         getattr(inscription.annee_etude, 'libelle', 
                                                getattr(inscription.annee_etude, 'name', None))),
                    'annee_academique': getattr(inscription.anneeAcademique, 'libelle', 
                                              getattr(inscription.anneeAcademique, 'nom', 
                                                     getattr(inscription.anneeAcademique, 'name', None)))
                })
        
        return Response(result)
        
    except Exception as e:
        import traceback
        print(f"Erreur serveur: {str(e)}\n{traceback.format_exc()}")
        return Response({"error": f"Erreur serveur: {str(e)}"}, status=500)