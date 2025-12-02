from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import pandas as pd
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from apps.authentification.services.excel_import_service import ExcelUserImportService
from apps.utilisateurs.models import (
    Etudiant, Professeur, Administrateur, 
    RespInscription, ResponsableSaisieNote, 
    Secretaire, Gestionnaire, ChefDepartement
)
from django.http import HttpResponse
import io


# Mapping des rôles vers les modèles de profil



@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@transaction.atomic
def importUsersFromExcelView(request):
    ROLE_PROFILE_MAP = {
    'etudiant': Etudiant,
    'professeur': Professeur,
    'admin': Administrateur,
    'resp_inscription': RespInscription,
    'resp_notes': ResponsableSaisieNote,
    'secretaire': Secretaire,
    'gestionnaire': Gestionnaire,
    'chef_dpt': ChefDepartement,
    }

    if 'file' not in request.FILES:
        return Response(
            {'success': False, 'error': 'Aucun fichier fourni'},
            status=status.HTTP_400_BAD_REQUEST
        )

    excel_file = request.FILES['file']

    if not excel_file.name.endswith(('.xlsx', '.xls')):
        return Response(
            {'success': False, 'error': 'Format invalide (.xlsx ou .xls requis)'},
            status=status.HTTP_400_BAD_REQUEST
        )

    import_service = ExcelUserImportService()
    result = import_service.import_users(excel_file)

    if not result['success']:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    created_users_with_profiles = []

    try:
        for user_data in result['created_users']:
            user = user_data['user']
            role = user_data['role']

            profile_model = ROLE_PROFILE_MAP.get(role)

            if profile_model:
                # ⚠️ Tu dois au minimum prévoir les champs obligatoires ici
                profile_model.objects.create(
                    utilisateur=user
                )

            created_users_with_profiles.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'nom': user.last_name,
                'prenoms': user.first_name,
                'role': role,
                'telephone': user.telephone,
            })

    except Exception as e:
        return Response(
            {'success': False, 'error': f'Erreur création profils: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        'success': True,
        'message': result['message'],
        'created_count': result['created_count'],
        'users': created_users_with_profiles
    }, status=status.HTTP_201_CREATED)

@api_view(["GET"])
def excelTemplateDownloadView(request):
    

    data = {
        'nom': ['Doe', 'Smith', 'Dupont'],
        'prenoms': ['John', 'Jane', 'Marie'],
        'email': ['john.doe@example.com', 'jane.smith@example.com', 'marie.dupont@example.com'],
        'role': ['professeur', 'gestionnaire', 'secretaire'],
        'telephone': ['+228 90 00 00 00', '+228 91 11 11 11', '+228 92 22 22 22']
    }

    df = pd.DataFrame(data)

    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Utilisateurs')

        roles_df = pd.DataFrame({
            'Rôles valides': [
                'etudiant', 'professeur', 'admin', 'resp_notes',
                'resp_inscription', 'secretaire', 'gestionnaire', 'chef_dpt'
            ]
        })
        roles_df.to_excel(writer, index=False, sheet_name='Rôles valides')

    output.seek(0)

    response = HttpResponse(
        output.read(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=modele_import_utilisateurs.xlsx'

    return response
