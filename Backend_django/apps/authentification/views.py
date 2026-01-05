from django.shortcuts import render
from rest_framework import generics, status
# Create your views here.

from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework import status, views
from django.contrib.auth.tokens import default_token_generator
from urllib import request
from ..utilisateurs.services.journal import enregistrer_action

from ..utilisateurs.services.journal import enregistrer_action
from .serializers import RegisterSerializer, StudentRegisterSerializer
from rest_framework.permissions import AllowAny
from .services.auth_service import AuthService, User
from rest_framework.views import APIView
from apps.utilisateurs.models import Utilisateur
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator


class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response({"message": "Utilisateur créé avec succès", "id": instance.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        user = authenticate(username=request.data['username'], password=request.data['password'])
        if user and user.doit_changer_mdp:
            return Response({
                'error': 'Utilisez le lien de première connexion envoyé par email.'
            }, status=403)
        username = request.data.get("username")
        password = request.data.get("password")
        data = AuthService.login(username, password)
        if not data:
            enregistrer_action(
                utilisateur=None,
                action="Tentative de connexion",
                objet="Authentification",
                ip=request.META.get('REMOTE_ADDR'),
                statut="ECHEC",
                description="Utilisateur inexistant"
            )
            return Response({"detail": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)
        enregistrer_action(
            utilisateur=user,
            action="Connexion",
            objet="Authentification",
            ip=request.META.get('REMOTE_ADDR'),
            statut="SUCCES",
            description="Connexion réussie"
        )    
        return Response(data, status=status.HTTP_200_OK)


class StudentRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = StudentRegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        etudiant = serializer.save()
        return Response(
            {
                "message": "Étudiant créé avec succès",
                "user_id": etudiant.utilisateur.id,
                "etudiant_id": etudiant.id
            },
            status=status.HTTP_201_CREATED
        )
        
@api_view(['POST'])
@permission_classes([AllowAny])
def check_username(request):
    username = request.data.get('username', '').strip()
    
    if not username:
        return Response(
            {'existe': False, 'disponible': False, 'erreur': 'Username vide'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    existe = Utilisateur.objects.filter(username=username).exists()
    
    return Response({
        'existe': existe,
        'disponible': not existe
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email(request):
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response(
            {'existe': False, 'disponible': False, 'erreur': 'Email vide'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    existe = Utilisateur.objects.filter(email=email).exists()
    
    return Response({
        'existe': existe,
        'disponible': not existe
    })
    
    
    # ==================== RÉCUPÉRATION DE MOT DE PASSE ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def demande_reset_password(request):
    """
    Demande de réinitialisation de mot de passe
    Envoie un email avec un lien de réinitialisation
    """
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response(
            {'error': 'Email requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Vérifier si l'utilisateur existe
        utilisateur = Utilisateur.objects.get(email=email)
        
        # Générer un token unique
        token = default_token_generator.make_token(utilisateur)
        uid = urlsafe_base64_encode(force_bytes(utilisateur.pk))
        
        # Créer le lien de réinitialisation (à adapter selon votre frontend)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
        
        # Envoyer l'email
        sujet = "Réinitialisation de votre mot de passe"
        message = f"""
        Bonjour {utilisateur.first_name or utilisateur.username},
        
        Vous avez demandé la réinitialisation de votre mot de passe.
        
        Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
        {reset_link}
        
        Ce lien expire dans 1 heure.
        
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        
        Cordialement,
        L'équipe de gestion académique
        """
        
        send_mail(
            sujet,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({
            'success': True,
            'message': 'Un email de réinitialisation a été envoyé à votre adresse'
        }, status=status.HTTP_200_OK)
        
    except Utilisateur.DoesNotExist:
        # Pour des raisons de sécurité, ne pas révéler si l'email existe
        return Response({
            'success': True,
            'message': 'Si cet email existe, un lien de réinitialisation a été envoyé'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return Response({
            'error': 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verifier_token_reset(request):
    """
    Vérifie si le token de réinitialisation est valide
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    
    if not uid or not token:
        return Response(
            {'valide': False, 'error': 'Paramètres manquants'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Décoder l'uid
        user_id = force_str(urlsafe_base64_decode(uid))
        utilisateur = Utilisateur.objects.get(pk=user_id)
        
        # Vérifier le token
        if default_token_generator.check_token(utilisateur, token):
            return Response({
                'valide': True,
                'message': 'Token valide'
            })
        else:
            return Response({
                'valide': False,
                'error': 'Token invalide ou expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (TypeError, ValueError, OverflowError, Utilisateur.DoesNotExist):
        return Response({
            'valide': False,
            'error': 'Token invalide'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Réinitialise le mot de passe avec le token
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    nouveau_password = request.data.get('password')
    confirmation_password = request.data.get('password_confirmation')
    
    # Validation des champs
    if not all([uid, token, nouveau_password, confirmation_password]):
        return Response(
            {'error': 'Tous les champs sont requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if nouveau_password != confirmation_password:
        return Response(
            {'error': 'Les mots de passe ne correspondent pas'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Décoder l'uid
        user_id = force_str(urlsafe_base64_decode(uid))
        utilisateur = Utilisateur.objects.get(pk=user_id)
        
        # Vérifier le token
        if not default_token_generator.check_token(utilisateur, token):
            return Response({
                'error': 'Token invalide ou expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Valider le nouveau mot de passe
        try:
            validate_password(nouveau_password, utilisateur)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Changer le mot de passe
        utilisateur.set_password(nouveau_password)
        utilisateur.save()
        
        # Envoyer un email de confirmation
        try:
            send_mail(
                'Votre mot de passe a été modifié',
                f"""
                Bonjour {utilisateur.first_name or utilisateur.username},
                
                Votre mot de passe a été modifié avec succès.
                
                Si vous n'êtes pas à l'origine de cette modification, 
                contactez immédiatement l'administration.
                
                Cordialement,
                L'équipe de gestion académique
                """,
                settings.DEFAULT_FROM_EMAIL,
                [utilisateur.email],
                fail_silently=True,
            )
        except:
            pass  # Ne pas bloquer si l'email échoue
        
        return Response({
            'success': True,
            'message': 'Mot de passe réinitialisé avec succès'
        }, status=status.HTTP_200_OK)
        
    except (TypeError, ValueError, OverflowError, Utilisateur.DoesNotExist):
        return Response({
            'error': 'Lien invalide'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Erreur lors de la réinitialisation: {str(e)}")
        return Response({
            'error': 'Erreur lors de la réinitialisation du mot de passe'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
user = get_user_model()

class SetPasswordView(APIView):
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            uid = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Lien invalide'}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Lien expiré ou invalide'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'success': True})