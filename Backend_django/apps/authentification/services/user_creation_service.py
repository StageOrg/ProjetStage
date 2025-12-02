from django.db import transaction
from ..serializers import PartialRegisterSerializer
from .password_service import send_password_setup_email


class UserCreationService:

    @staticmethod
    @transaction.atomic
    def create_user(data):
        serializer = PartialRegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        send_password_setup_email(user)

        return user
