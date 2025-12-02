from rest_framework.views import APIView
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import PasswordSetupToken
from django.contrib.auth.hashers import make_password
from .services.user_creation_service import UserCreationService
from .services.excel_import_service import ExcelUserImportService


# ✅ Création manuelle
class PartialRegisterAPIView(APIView):

    def post(self, request):
        user = UserCreationService.create_user(request.data)

        return Response({
            "success": True,
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_201_CREATED)


# ✅ Définition du mot de passe
class SetPasswordAPIView(APIView):

    def post(self, request):
        token = request.data.get("token")
        password = request.data.get("password")

        if not token or not password:
            return Response({"error": "Token et mot de passe requis"}, status=400)

        try:
            token_obj = PasswordSetupToken.objects.get(
                token=token,
                is_used=False
            )
        except PasswordSetupToken.DoesNotExist:
            return Response({"error": "Token invalide"}, status=400)

        user = token_obj.user
        user.set_password(password)
        user.save()

        token_obj.is_used = True
        token_obj.save()

        return Response({"success": True}, status=200)


# ✅ Import Excel
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def importUsersFromExcelView(request):

    if 'file' not in request.FILES:
        return Response({"error": "Aucun fichier"}, status=400)

    service = ExcelUserImportService()
    result = service.import_users(request.FILES['file'])

    return Response(result, status=201 if result["success"] else 400)
