from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from apps.inscription_pedagogique.models import Inscription
# ✅ Liste des inscriptions d’un étudiant
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_inscriptions_etudiant(request, etudiant_id):
    inscriptions = (
        Inscription.objects
        .filter(etudiant_id=etudiant_id)
        .select_related('anneeAcademique', 'filiere', 'parcours', 'annee_etude')
        .order_by('-anneeAcademique__libelle')
    )

    data = [
        {
            "id": ins.id,
            "annee_academique": ins.anneeAcademique.libelle,
            "filiere": ins.filiere.nom,
            "parcours": ins.parcours.libelle,
            "annee_etude": ins.annee_etude.libelle,
        }
        for ins in inscriptions
    ]

    return Response(data)


# ✅ Liste des UEs d’une inscription
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_ues_inscription(request, inscription_id):
    try:
        inscription = (
            Inscription.objects
            .prefetch_related('ues')
            .get(id=inscription_id)
        )
        ues_data = [
            {
                "id": ue.id,
                "code": ue.code,
                "libelle": ue.libelle,
            }
            for ue in inscription.ues.all()
        ]
        return Response(ues_data)
    except Inscription.DoesNotExist:
        return Response({'error': 'Inscription non trouvée'}, status=404)
