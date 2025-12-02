from django.db import models
from django.db import models
from django.conf import settings
import uuid

class PasswordSetupToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PasswordSetupToken(user={self.user.username}, token={self.token}, is_used={self.is_used})"