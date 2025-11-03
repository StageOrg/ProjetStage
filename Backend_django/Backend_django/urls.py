# Backend_django/Backend_django/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Include app URLs
    path('api/utilisateurs/', include('apps.utilisateurs.urls')),
    path('api/inscription/', include('apps.inscription_pedagogique.urls')),
    path('api/notes/', include('apps.page_professeur.urls')),
    path('api/auth/', include('apps.authentification.urls')),   
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

