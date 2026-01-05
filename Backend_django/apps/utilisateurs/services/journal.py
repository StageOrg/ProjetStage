from ..models import JournalAction

def enregistrer_action(
    utilisateur=None,
    action="",
    objet="",
    ip=None,
    statut="SUCCES",
    description=""
):
    JournalAction.objects.create(
        utilisateur=utilisateur,
        action=action,
        objet=objet,
        ip=ip,
        statut=statut,
        description=description,
    )