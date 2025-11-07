# apps/inscription_pedagogique/views/apiviews/inscription_admin/premiere_connexion.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from apps.utilisateurs.models import Utilisateur

class PremiereConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not all([uid, token, password]):
            return Response({'error': 'Données manquantes'}, status=400)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = Utilisateur.objects.get(pk=user_id)

            if not default_token_generator.check_token(user, token):
                return Response({'error': 'Lien invalide ou expiré'}, status=400)

            user.set_password(password)
            user.doit_changer_mdp = False
            user.save()

            return Response({'success': True, 'message': 'Mot de passe mis à jour avec succès !'})
        except (Utilisateur.DoesNotExist, ValueError):
            return Response({'error': 'Lien invalide'}, status=400)