
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from apps.inscription_pedagogique.models import Inscription
from rest_framework.permissions import IsAuthenticated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_inscription_detail(request, inscription_id):
    """
    Retourne toutes les informations détaillées d'une inscription
    avec ses UEs et informations académiques
    """
    try:
        inscription = Inscription.objects.select_related(
            'anneeAcademique',
            'filiere',
            'filiere__departement',
            'filiere__departement__etablissement',
            'parcours',
            'annee_etude'
        ).prefetch_related(
            'ues',
            'ues__semestre'
        ).get(id=inscription_id)
        
        # Informations de l'inscription
        inscription_data = {
            "id": inscription.id,
            "numero": inscription.numero,
            "date_inscription": inscription.date.isoformat() if inscription.date else None,
            
            # Année académique
            "annee_academique": {
                "id": inscription.anneeAcademique.id,
                "libelle": inscription.anneeAcademique.libelle,
                "est_active": inscription.anneeAcademique.est_active
            },
            
            # Parcours
            "parcours": {
                "id": inscription.parcours.id,
                "libelle": inscription.parcours.libelle,
                "abbreviation": inscription.parcours.abbreviation
            },
            
            # Filière
            "filiere": {
                "id": inscription.filiere.id,
                "nom": inscription.filiere.nom,
                "abbreviation": inscription.filiere.abbreviation,
                "departement": {
                    "id": inscription.filiere.departement.id,
                    "nom": inscription.filiere.departement.nom,
                    "abbreviation": inscription.filiere.departement.abbreviation,
                    "etablissement": {
                        "id": inscription.filiere.departement.etablissement.id,
                        "nom": inscription.filiere.departement.etablissement.nom,
                        "abbreviation": inscription.filiere.departement.etablissement.abbreviation
                    }
                }
            },
            
            # Année d'étude
            "annee_etude": {
                "id": inscription.annee_etude.id,
                "libelle": inscription.annee_etude.libelle
            },
        }
        
        # Liste des UEs avec détails
        ues_data = []
        for ue in inscription.ues.all().order_by('semestre__libelle', 'code'):
            ue_info = {
                "id": ue.id,
                "code": ue.code,
                "libelle": ue.libelle,
                "credit": ue.credit if hasattr(ue, 'credit') else None,
                "coefficient": ue.coefficient if hasattr(ue, 'coefficient') else None,
                "semestre": {
                    "id": ue.semestre.id,
                    "libelle": ue.semestre.libelle
                } if ue.semestre else None,
            }
            ues_data.append(ue_info)
        
        # Statistiques
        total_credits = sum(ue.get('credit', 0) or 0 for ue in ues_data)
        nombre_ues = len(ues_data)
        
        # Réponse complète
        return Response({
            "inscription": inscription_data,
            "ues": ues_data,
            "statistiques": {
                "nombre_ues": nombre_ues,
                "total_credits": total_credits
            }
        })
        
    except Inscription.DoesNotExist:
        return Response({
            'error': 'Inscription non trouvée'
        }, status=404)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la récupération des données: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_inscriptions_etudiant(request, etudiant_id):
    """Liste des inscriptions d'un étudiant"""
    inscriptions = (
        Inscription.objects
        .filter(etudiant_id=etudiant_id)
        .select_related('anneeAcademique', 'filiere', 'parcours', 'annee_etude')
        .order_by('-anneeAcademique__libelle')
    )
    data = [
        {
            "id": ins.id,
            "numero": ins.numero,
            "annee_academique": ins.anneeAcademique.libelle,
            "filiere": ins.filiere.nom,
            "parcours": ins.parcours.libelle,
            "annee_etude": ins.annee_etude.libelle,
            "date_inscription": ins.date.isoformat() if ins.date else None,
        }
        for ins in inscriptions
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def get_ues_inscription(request, inscription_id):
    """Liste des UEs d'une inscription (version simplifiée)"""
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