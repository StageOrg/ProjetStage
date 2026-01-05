
from django.urls import path
from .views import RegisterView, LoginView, StudentRegisterView, check_email, check_username, demande_reset_password, reset_password, verifier_token_reset
from django.urls import path
from .apiView import (
    PartialRegisterAPIView,
    SetPasswordAPIView,
    importUsersFromExcelView
)
from .views import RegisterView, LoginView, SetPasswordView, StudentRegisterView, check_email, check_username, demande_reset_password, reset_password, verifier_token_reset

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path("register-etudiant/", StudentRegisterView.as_view(), name="register-etudiant"),
    path('check_username/', check_username, name='check-username'),
    path('check_email/',check_email, name='check-email'),
    path('password-reset/demande/', demande_reset_password, name='demande_reset_password'),
    path('password-reset/verifier/', verifier_token_reset, name='verifier_token_reset'),
    path('password-reset/confirmer/', reset_password, name='reset_password'),
    path("partial-register/", PartialRegisterAPIView.as_view()),
    path("set-password/", SetPasswordAPIView.as_view()),
    path("import-excel/", importUsersFromExcelView),
    path('api/set-password/', SetPasswordView.as_view()),
]
