from django.apps import AppConfig



class UtilisateursConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.utilisateurs'
    def ready(self):
        # Importer les signaux au démarrage de l'application
        import apps.utilisateurs.signals
        