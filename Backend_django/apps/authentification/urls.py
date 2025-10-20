
from django.urls import path
from .views import RegisterView, LoginView, StudentRegisterView, check_email, check_username

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path("register-etudiant/", StudentRegisterView.as_view(), name="register-etudiant"),
    path('check_username/', check_username, name='check-username'),
    path('check_email/',check_email, name='check-email'),
]
