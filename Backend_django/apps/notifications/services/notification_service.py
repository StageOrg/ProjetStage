from ..models import Notification
from django.core.mail import send_mail
from django.conf import settings

class NotificationService:

    # ✅ Envoyer une notification à 1 utilisateur
    @staticmethod
    def send_to_user(user, message):
        return (Notification.objects.create(
            user=user,
            message=message
        ),
        send_mail(
        subject="Création de votre compte",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    ))
    


    # ✅ Envoyer une notification à plusieurs utilisateurs
    @staticmethod
    def send_to_many(users, message):
        notifications = [
            Notification(user=user, message=message)
            for user in users
        ]
        Notification.objects.bulk_create(notifications)
        send_mail(
        subject="Création de votre compte",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email for user in users],
        fail_silently=False,
        )

    # ✅ Marquer une notification comme lue
    @staticmethod
    def mark_as_read(notification):
        notification.is_read = True
        notification.save()

    # ✅ Tout marquer comme lues
    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)

    # ✅ Compter les notifications non lues (pour la cloche 🔔)
    @staticmethod
    def unread_count(user):
        return Notification.objects.filter(user=user, is_read=False).count()

    