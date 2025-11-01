from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from ..utilisateurs.models import (
    Professeur, Etudiant,
    RespInscription, ResponsableSaisieNote, Secretaire, Gestionnaire, ChefDepartement
)
from apps.utilisateurs.serializers import (
    ProfesseurSerializer, EtudiantSerializer,
    RespInscriptionSerializer, ResponsableSaisieNoteSerializer, SecretaireSerializer, GestionnaireSerializer, ChefDepartementSerializer
)
from apps.authentification.permissions import IsIntranet, IsSelfOrAdmin, IsAdminOrReadOnly
from rest_framework.permissions import AllowAny
from apps.utilisateurs.models import Utilisateur, Administrateur, Connexion
from apps.utilisateurs.serializers import (
    UtilisateurSerializer,
    AdministrateurSerializer,
    ConnexionSerializer
)
from apps.page_professeur.serializers import UESerializer
from rest_framework.decorators import api_view, permission_classes
# ----- UTILISATEUR DE BASE -----
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all().order_by('last_name')
    serializer_class = UtilisateurSerializer
    pagination_class = None

    #permission_classes = [IsAdminUser]  # Seul admin peut voir/lister tous les utilisateurs
   
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """/me/ : Voir ou modifier ses propres infos"""
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
    # permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_etudiant:
            return Etudiant.objects.filter(utilisateur=user)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put'], 
    permission_classes=[IsAuthenticated])
    def me(self, request):
        """Endpoint pour récupérer/modifier le profil de l'étudiant connecté"""
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
    
    @action(detail=False, methods=['get', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = request.user.professeur
        serializer = self.get_serializer(instance, data=request.data if request.method == 'PUT' else None, partial=True)
        if serializer.is_valid():
            serializer.save()
        elif request.method == 'PUT':
            return Response(serializer.errors, status=400)
        return Response(serializer.data)
        
    
    """  @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def ues(self, request, pk=None):
        professeur = self.get_object()
        affectations = professeur.affectations.all()
        ues = [aff.ue for aff in affectations]
        serializer = UESerializer(ues, many=True)
        return Response(serializer.data) """
        
    #Recuperation des UEs d'un professeur donné (par id)
    @action(detail=True, methods=['get'], url_path='ues-prof')
    def mes_ues_id(self, request, pk=None):
        professeur = self.get_object()
        affectations = professeur.affectations.all()
        ues = [aff.ue for aff in affectations]
        serializer = UESerializer(ues, many=True)
        return Response(serializer.data)
    
    #Recuperation des UEs d'un professeur connecté
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
    
    
class ConnexionViewSet(viewsets.ModelViewSet):
    """
     Vue pour consulter les connexions des utilisateurs.
    - Les admins peuvent voir toutes les connexions.
    - Un utilisateur ne voit que ses propres connexions.
    """
    queryset = Connexion.objects.all().order_by('-date_connexion') # Trier par date de connexion décroissante 
    serializer_class = ConnexionSerializer
    permission_classes = [IsIntranet, IsAdminUser]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Connexion.objects.all()
        return Connexion.objects.filter(utilisateur=user)
        
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