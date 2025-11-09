# backend/apps/utilisateurs/signals.py
import logging
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import Etudiant

logger = logging.getLogger(__name__)

@receiver(pre_delete, sender=Etudiant)
def supprimer_utilisateur_avec_etudiant(sender, instance, **kwargs):
    """
    Supprime l'utilisateur associé à l'étudiant.
    Évite les boucles infinies.
    """
    if not instance.utilisateur:
        return

    try:
        utilisateur = instance.utilisateur
        if utilisateur.pk:
            # DÉCONNEXION TEMPORAIRE DES SIGNAUX
            from django.db.models.signals import pre_delete
            pre_delete.disconnect(supprimer_utilisateur_avec_etudiant, sender=Etudiant)
            
            logger.info(f"Suppression de l'utilisateur: {utilisateur.username}")
            utilisateur.delete()
            logger.info("Utilisateur supprimé avec succès")
            
            # RECONNEXION
            pre_delete.connect(supprimer_utilisateur_avec_etudiant, sender=Etudiant)
            
    except Exception as e:
        logger.warning(f"Échec suppression utilisateur (étudiant {instance.id}): {e}")
        # Reconnecter même en cas d'erreur
        pre_delete.connect(supprimer_utilisateur_avec_etudiant, sender=Etudiant)