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

                    annee_acad = e.get('annee_academique') or log.details.get('annee_academique') or ''
                    if annee and annee_acad != annee:
                        continue

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
                        "annee_academique": annee_acad,
                        # On garde juste l'année pour les créations (ou tu peux ajouter parcours/filière si tu veux)
                    })

            # === SUPPRESSIONS ===
            elif log.methode == 'suppression':
                info = log.details.get('etudiant_supprime', {})

                annee_acad = info.get('annee_academique', '') or "Non défini"
                if annee and annee_acad != "Non défini" and annee_acad != annee:
                    continue

                # Récupération des abréviations parcours/filière
                parcours_abbrev = info.get('parcours_abbrev', '').strip().upper()
                filiere_abbrev = info.get('filiere_abbrev', '').strip().upper()
                parcours_libelle = info.get('parcours_libelle', '')
                filiere_nom = info.get('filiere_nom', '')

                # Format affiché : LIC-INFO ou "Licence - Informatique" si pas d'abbrev
                if parcours_abbrev and filiere_abbrev:
                    parcours_filiere = f"{parcours_abbrev}-{filiere_abbrev}"
                elif parcours_libelle and filiere_nom:
                    parcours_filiere = f"{parcours_libelle} - {filiere_nom}"
                else:
                    parcours_filiere = "Non défini"

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
                    "annee_academique": annee_acad,
                    "parcours_filiere": parcours_filiere,  # Nouvelle clé utilisée dans le frontend
                })

        # Filtre type_op
        if type_op == "creation":
            resultats = [r for r in resultats if not r["is_suppression"]]
        elif type_op == "suppression":
            resultats = [r for r in resultats if r["is_suppression"]]

        return Response({
            "historique": resultats,
            "total": len(resultats)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Réactivé pour sécurité
def enregistrer_suppression(request):
    data = request.data.get('etudiant_supprime', {})

    if not data.get('nom'):
        return Response({"error": "Nom requis pour l'historique"}, status=400)

    try:
        historique = ImportEtudiant.objects.create(
            admin=request.user.resp_inscription if hasattr(request.user, 'resp_inscription') else None,
            methode='suppression',
            details={"etudiant_supprime": data},
            reussis=1
        )
        return Response({
            "status": "ok",
            "message": "Suppression enregistrée dans l'historique",
            "historique_id": historique.id,
        })
    except Exception as e:
        return Response({"error": f"Erreur: {str(e)}"}, status=500)