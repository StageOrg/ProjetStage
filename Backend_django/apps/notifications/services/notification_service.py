from ..models import Notification
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:

    # ✅ Envoyer une notification à 1 utilisateur
    @staticmethod
    def send_to_user(user, message):
        # 1️⃣ Création de la notification en base
        notification = Notification.objects.create(
            user=user,
            message=message
        )

        # 2️⃣ Envoi de l'email si l'utilisateur a un email
        if user.email:
            try:
                send_mail(
                    subject="Saisie de notes",
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,  # Ne pas bloquer si ça échoue
                )
                logger.info(f"Email envoyé à {user.email}")

            except Exception as e:
                logger.error(
                    f"Impossible d'envoyer l'email à {user.email}: {str(e)}"
                )

        return notification
    


    # ✅ Envoyer une notification à plusieurs utilisateurs
    @staticmethod
    def send_to_many(users, message):
        notifications = [
            Notification(user=user, message=message)
            for user in users
        ]
        Notification.objects.bulk_create(notifications)
        try:
            send_mail(
            subject="Période de saisie de notes",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email for user in users],
            fail_silently=False,
            )
            logger.info(f"Email envoyé à {[user.email for user in users]}")

        except Exception as e:
                logger.error(
                    f"Impossible d'envoyer l'email à {[user.email for user in users]}: {str(e)}"
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

    