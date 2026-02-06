from django.core.mail import send_mail
from django.conf import settings
from ..models import PasswordSetupToken

def send_password_setup_email(user):
    token_obj = PasswordSetupToken.objects.create(user=user)

    #link = f"http://localhost:3000/set-password/{token_obj.token}"
    link = f"https://epl.univ-lome.tg/set-password/{token_obj.token}"


    send_mail(
        subject="Création de votre compte",
        message=f"""
Bonjour {user.first_name},

Votre compte a été créé.

Nom d'utilisateur : {user.username}

Cliquez sur ce lien pour définir votre mot de passe :
{link}
        """,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


