# apps/inscription_pedagogique/views/apiviews/get_ue_multiniveau.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.page_professeur.models import UE
from apps.inscription_pedagogique.models import AnneeEtude

@api_view(['GET'])
@permission_classes([AllowAny])
def get_ues_multi_niveaux(request):
    try:
        parcours_id = request.GET.get('parcours')
        filiere_id = request.GET.get('filiere')
        annee_etude_id = request.GET.get('annee_etude')

        if not all([parcours_id, filiere_id, annee_etude_id]):
            return Response({'error': 'Paramètres manquants'}, status=400)

        annee_selectionnee = AnneeEtude.objects.get(id=annee_etude_id)

        ordre_annees = {
            'Licence 1': 1, 'Licence 2': 2, 'Licence 3': 3,
            'Master 1': 4, 'Master 2': 5,
        }

        ordre = ordre_annees.get(annee_selectionnee.libelle)
        if not ordre:
            return Response({'error': 'Niveau non reconnu'}, status=400)

        niveaux_a_charger = [l for l, o in ordre_annees.items() if o <= ordre]
        annees_etude_objets = AnneeEtude.objects.filter(libelle__in=niveaux_a_charger)

        ues = UE.objects.filter(
            parcours__id=parcours_id,        # ← Corrigé : ManyToMany
            filiere__id=filiere_id,          # ← Corrigé : ManyToMany
            annee_etude__in=annees_etude_objets
        ).select_related('semestre') \
         .prefetch_related('ues_composantes') \
         .order_by('annee_etude__libelle', 'semestre__libelle', 'code')

        ues_data = []
        for ue in ues:
            ue_dict = {
                'id': ue.id,
                'code': ue.code,
                'libelle': ue.libelle,
                'nbre_credit': ue.nbre_credit,
                'composite': ue.composite,
                'semestre': {
                    'id': ue.semestre.id if ue.semestre else None,
                    'libelle': ue.semestre.libelle if ue.semestre else 'Non défini',
                },
                'annee_info': {
                    'id': ue.annee_etude.first().id if ue.annee_etude.exists() else None,
                    'libelle': ue.annee_etude.first().libelle if ue.annee_etude.exists() else '',
                    'ordre': ordre_annees.get(ue.annee_etude.first().libelle if ue.annee_etude.exists() else '', 0)
                },
                'ues_composantes': []
            }

            if ue.composite:
                ue_dict['ues_composantes'] = [
                    {
                        'id': comp.id,
                        'code': comp.code,
                        'libelle': comp.libelle,
                        'nbre_credit': comp.nbre_credit,
                        'semestre': {'libelle': comp.semestre.libelle if comp.semestre else 'Non défini'}
                    }
                    for comp in ue.ues_composantes.all()
                ]

            ues_data.append(ue_dict)

        return Response({
            'ues': ues_data,
            'niveaux_charges': niveaux_a_charger,
            'niveau_selectionne': annee_selectionnee.libelle,
            'total_ues': len(ues_data)
        })

    except Exception as e:
        print(f"❌ Erreur get_ues_multi_niveaux: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': 'Erreur serveur'}, status=500)