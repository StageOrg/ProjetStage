from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework import permissions
from .services.notification_service import NotificationService
from django.contrib.auth import get_user_model

User = get_user_model()


class MyNotificationsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(
            user=request.user
        ).order_by("-created_at")

        serializer = NotificationSerializer(notifs, many=True)
        return Response(serializer.data)

class MarkNotificationAsReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notif_id):
        try:
            notif = Notification.objects.get(
                id=notif_id,
                user=request.user
            )
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        NotificationService.mark_as_read(notif)

        return Response({"success": True})
    
    
class MarkAllNotificationsAsReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        NotificationService.mark_all_as_read(request.user)
        return Response({"success": True})
    
class UnreadNotificationCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationService.unread_count(request.user)
        return Response({"unread_count": count})


class SendNotificationAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("user_id")
        message = request.data.get("message")

        # ✅ Vérification des champs obligatoires
        if not user_id:
            return Response(
                {"error": "L'identifiant de l'utilisateur est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not message:
            return Response(
                {"error": "Le message est requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Vérifier que l'utilisateur existe
        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Envoi de la notification
        NotificationService.send_to_user(receiver, message)

        return Response(
            {
                "success": True,
                "message": "Notification envoyée avec succès",
                "receiver_id": receiver.id
            },
            status=status.HTTP_200_OK
        )

class SendNotificationToManyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_ids = request.data.get("user_ids", [])
        message = request.data.get("message")

        if not user_ids or not message:
            return Response(
                {"error": "Les user_ids et le message sont requis"},
                status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(id__in=user_ids)
        NotificationService.send_to_many(users, message)
        return Response({"success": True, "message": "Notifications envoyées"})