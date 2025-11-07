# apps/inscription_pedagogique/views/apiviews/inscription_admin/historique.py
from io import StringIO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.inscription_pedagogique.models import ImportEtudiant
from django.http import HttpResponse
import csv

class HistoriqueImportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'resp_inscription'):
            return Response({'error': 'Accès refusé'}, status=403)

        imports = ImportEtudiant.objects.filter(admin=request.user).values(
            'id', 'type_fichier', 'reussis', 'echoues', 'date_import'
        )
        return Response(list(imports))

    def post(self, request):
        # Télécharger un import spécifique
        import_id = request.data.get('import_id')
        try:
            imp = ImportEtudiant.objects.get(id=import_id, admin=request.user)
            details = imp.details

            if not details or 'reussis' not in details:
                return Response({'error': 'Détails non disponibles'}, status=400)

            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['Ligne', 'Nom', 'Prénom', 'Email', 'Username', 'Mot de passe'])
            for r in details['reussis']:
                writer.writerow([r['ligne'], r['nom'], r['prenom'], r['email'], r['username'], r['mot_de_passe_temporaire']])

            response = HttpResponse(output.getvalue(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="import_{imp.id}_details.csv"'
            return response
        except ImportEtudiant.DoesNotExist:
            return Response({'error': 'Import non trouvé'}, status=404)