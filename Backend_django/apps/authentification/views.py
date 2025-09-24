from django.shortcuts import render
from rest_framework import generics, status
# Create your views here.


from rest_framework.response import Response
from rest_framework import status, views

from .serializers import RegisterSerializer, StudentRegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .services.auth_service import AuthService
from rest_framework.views import APIView
from rest_framework import permissions
from apps.utilisateurs.models import Utilisateur
from django.contrib.auth import authenticate


class RegisterView(views.APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            instance = serializer.save()
            return Response({"message": "Utilisateur créé avec succès", "id": instance.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        data = AuthService.login(username, password)
        if not data:
            return Response({"detail": "Identifiants invalides"}, status=status.HTTP_401_UNAUTHORIZED)
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