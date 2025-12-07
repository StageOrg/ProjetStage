import pandas as pd
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from ..utilisateurs.services.journal import enregistrer_action
from .models import UE
from ..inscription_pedagogique.models import Parcours, Filiere, AnneeEtude, Semestre


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def import_ues(request):
    """
    Importer des UEs à partir d'un fichier Excel (.xlsx)
    Les colonnes doivent contenir les libellés et non les IDs.
    Colonnes attendues :
    libelle | code | nbre_credit | composite | parcours | filiere | annee_etude | semestre
    """
    fichier = request.FILES.get("file")

    if not fichier:
        return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        df = pd.read_excel(fichier)
    except Exception as e:
        return Response({"error": f"Erreur de lecture du fichier : {e}"}, status=status.HTTP_400_BAD_REQUEST)

    champs_requis = [
        "libelle", "code", "nbre_credit", "composite",
        "parcours", "filiere",
        "annee_etude", "semestre"
    ]

    # Vérifie que toutes les colonnes nécessaires existent
    for champ in champs_requis:
        if champ not in df.columns:
            return Response({"error": f"Colonne manquante : {champ}"}, status=status.HTTP_400_BAD_REQUEST)

    total_lignes = len(df)
    ues_creees = []
    erreurs = []

    for i, row in df.iterrows():
        try:
            # === Données simples ===
            libelle = str(row["libelle"]).strip()
            code = str(row["code"]).strip()
            nbre_credit = int(row["nbre_credit"])
            composite = bool(row["composite"]) if not pd.isna(row["composite"]) else False

            # === Données liées ===
            parcours_libelles = [p.strip() for p in str(row["parcours"]).split(",") if p.strip()]
            filiere_libelles = [f.strip() for f in str(row["filiere"]).split(",") if f.strip()]
            annee_etude_libelles = [a.strip() for a in str(row["annee_etude"]).split(",") if a.strip()]
            semestre_libelle = str(row["semestre"]).strip()

            parcours_objs = list(Parcours.objects.filter(libelle__in=parcours_libelles))
            filiere_objs = list(Filiere.objects.filter(nom__in=filiere_libelles))
            annee_etude_objs = list(AnneeEtude.objects.filter(libelle__in=annee_etude_libelles))
            semestre_obj = Semestre.objects.filter(libelle=semestre_libelle).first()

            # === Vérifications ===
            if not semestre_obj:
                raise ValueError(f"Semestre '{semestre_libelle}' introuvable.")
            if len(parcours_objs) != len(parcours_libelles):
                manquants = set(parcours_libelles) - {p.libelle for p in parcours_objs}
                raise ValueError(f"Parcours introuvables : {', '.join(manquants)}")
            if len(filiere_objs) != len(filiere_libelles):
                manquants = set(filiere_libelles) - {f.nom for f in filiere_objs}
                raise ValueError(f"Filières introuvables : {', '.join(manquants)}")
            if len(annee_etude_objs) != len(annee_etude_libelles):
                manquants = set(annee_etude_libelles) - {a.libelle for a in annee_etude_objs}
                raise ValueError(f"Années d'étude introuvables : {', '.join(manquants)}")

            # === Création de l’UE ===
            ue, created = UE.objects.get_or_create(
                code=code,
                defaults={
                    "libelle": libelle,
                    "nbre_credit": nbre_credit,
                    "composite": composite,
                    "semestre": semestre_obj,
                },
            )

            # Si elle existe déjà → on ignore
            if not created:
                erreurs.append({
                    "ligne": i + 2,
                    "message": f"L'UE avec le code '{code}' existe déjà."
                })
                continue

            ue.parcours.set(parcours_objs)
            ue.filiere.set(filiere_objs)
            ue.annee_etude.set(annee_etude_objs)

            # === On ajoute la nouvelle UE créée ===
            ues_creees.append({
                "id": ue.id,
                "libelle": ue.libelle,
                "code": ue.code,
                "nbre_credit": ue.nbre_credit,
                "composite": ue.composite,
                "semestre": ue.semestre.libelle,
                "parcours": [p.libelle for p in parcours_objs],
                "filiere": [f.nom for f in filiere_objs],
                "annee_etude": [a.libelle for a in annee_etude_objs],
            })

        except Exception as e:
            erreurs.append({
                "ligne": i + 2,  # ligne Excel (en comptant l’en-tête)
                "message": str(e)
            })

    # === Résumé final ===
    nb_creees = len(ues_creees)
    nb_erreurs = len(erreurs)
    enregistrer_action(
            utilisateur=request.user,
            action="Importation d'UEs",
            objet="UEs avec examen anonyme",
            ip=request.META.get('REMOTE_ADDR'),
            description="Création d'ues par importation de fichier Excel"
        )
    

    resultat = {
        "status": "succès partiel" if erreurs else "succès complet",
        "total_lignes": total_lignes,
        "ues_creees": nb_creees,
        "ues_ignorees": nb_erreurs,
        "message": f"✅ {nb_creees} UE créées, ❌ {nb_erreurs} ignorées sur {total_lignes} lignes.",
        "ues": ues_creees,  # <<---  liste des UEs créées
        "erreurs": erreurs
    }

    http_status = status.HTTP_207_MULTI_STATUS if erreurs else status.HTTP_201_CREATED
    return Response(resultat, status=http_status)
