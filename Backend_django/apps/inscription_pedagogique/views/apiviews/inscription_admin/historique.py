# apps/inscription_pedagogique/views/historique.py
from pytz import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.inscription_pedagogique.models import ImportEtudiant
from rest_framework.decorators import api_view, permission_classes

class HistoriqueOperationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'resp_inscription'):
            return Response({"error": "Accès refusé"}, status=403)

        annee = request.query_params.get('annee')
        type_op = request.query_params.get('type')  # "creation" ou "suppression"

        logs = ImportEtudiant.objects.all().order_by('-date_import')
        resultats = []

        for log in logs:
            # Qui a fait l'opération
            cree_par = (
                log.admin.utilisateur.get_full_name().strip() or
                log.admin.utilisateur.username if log.admin else "Système"
            )

            # === CRÉATIONS ===
            if log.methode in ['manuel', 'import']:
                etudiants = (
                    log.details.get('reussis', []) or
                    log.details.get('etudiants', []) or
                    [log.details.get('etudiant', {})]
                )

                for e in etudiants:
                    if not e: 
                        continue

                    # FIX: Récupération de l'année académique
                    annee_acad = (
                        e.get('annee_academique') or 
                        log.details.get('annee_academique') or 
                        ''
                    )

                    if annee and annee_acad != annee:
                        continue

                    # FIX: Récupération du numéro d'inscription
                    numero_inscription = (
                        e.get('numero_inscription') or 
                        e.get('numero') or 
                        '-'
                    )

                    resultats.append({
                        "date": log.date_import.strftime("%d/%m/%Y %H:%M"),
                        "cree_par": cree_par,
                        "operation": "Créé",
                        "is_suppression": False,
                        "nom": e.get('nom', '').upper(),
                        "prenom": e.get('prenom', '').title(),
                        "username": e.get('username', ''),
                        "email": e.get('email', ''),
                        "mdp_temp": e.get('mot_de_passe_temporaire', ''),
                        "numero_inscription": numero_inscription,
                        "annee_academique": annee_acad,
                    })

            # === SUPPRESSIONS ===
            elif log.methode == 'suppression':
                info = log.details.get('etudiant_supprime', {})
                
                # FIX: Récupération de l'année académique pour suppression
                annee_acad = info.get('annee_academique', '') or ''

                if annee and annee_acad and annee_acad != annee:
                    continue

                # FIX: Récupération du numéro d'inscription pour suppression
                numero_inscription = (
                    info.get('numero_inscription') or 
                    info.get('numero') or 
                    '-'
                )

                resultats.append({
                    "date": log.date_import.strftime("%d/%m/%Y %H:%M"),
                    "cree_par": cree_par,
                    "operation": "Supprimé",
                    "is_suppression": True,
                    "nom": info.get('nom', 'Inconnu').upper(),
                    "prenom": info.get('prenom', '').title(),
                    "username": info.get('username', '-'),
                    "email": info.get('email', '-'),
                    "mdp_temp": "",
                    "numero_inscription": numero_inscription,
                    "annee_academique": annee_acad or "Non défini",
                })

        # Filtre type création/suppression
        if type_op == "creation":
            resultats = [r for r in resultats if not r["is_suppression"]]
        elif type_op == "suppression":
            resultats = [r for r in resultats if r["is_suppression"]]

        return Response({
            "historique": resultats,
            "total": len(resultats)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enregistrer_suppression(request):
    """
    Enregistre la suppression d'un étudiant dans l'historique
    """
    data = request.data.get('etudiant_supprime', {})
    
    # Validation des données minimales requises
    if not data.get('nom'):
        return Response(
            {"error": "Nom requis pour l'historique"}, 
            status=400
        )
    
    # Log pour debug
    print("📝 Enregistrement suppression:", data)
    
    # Créer l'entrée d'historique
    try:
        historique = ImportEtudiant.objects.create(
            admin=request.user.resp_inscription if hasattr(request.user, 'resp_inscription') else None,
            methode='suppression',
            details={"etudiant_supprime": data},
            reussis=1
        )
        
        print(f"✅ Historique créé: ID={historique.id}")
        print(f"   - Nom: {data.get('nom')}")
        print(f"   - Année: {data.get('annee_academique')}")
        print(f"   - N° Inscription: {data.get('numero_inscription')}")
        
        return Response({
            "status": "ok",
            "message": "Suppression enregistrée dans l'historique",
            "historique_id": historique.id,
            "data_enregistree": data
        })
    except Exception as e:
        print(f"❌ Erreur création historique: {str(e)}")
        return Response(
            {"error": f"Erreur lors de l'enregistrement: {str(e)}"}, 
            status=500
        )