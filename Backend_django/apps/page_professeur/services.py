# Dans un fichier services.py ou utils.py

from apps.page_professeur.models import Note, ResultatUE
from django.db.models import Q
from apps.page_professeur.models import Note, ResultatUE
from apps.inscription_pedagogique.models import Inscription, Etudiant
from django.core.exceptions import ValidationError


def calculer_validation_ue(etudiant, ue, inscription):
    """
    Calcule si l'étudiant a validé une UE et crée/met à jour le ResultatUE
    """
    
    # CAS 1: UE Simple (composite=False)
    if not ue.composite:
        # 1. Récupérer toutes les notes de l'étudiant pour cette UE
        notes = Note.objects.filter(
            etudiant=etudiant,
            evaluation__ue=ue
        ).select_related('evaluation')
        
        # 2. Calculer la moyenne pondérée
        moyenne = calculer_moyenne_ponderee(notes)
        
        # 3. Déterminer la validation
        est_valide = moyenne >= 10
        credits_obtenus = ue.nbre_credit if est_valide else 0
        
        # 4. Créer ou mettre à jour le ResultatUE
        resultat, created = ResultatUE.objects.update_or_create(
            etudiant=etudiant,
            ue=ue,
            inscription=inscription,
            defaults={
                'moyenne': moyenne,
                'est_valide': est_valide,
                'credits_obtenus': credits_obtenus,
                'details_validation': None
            }
        )
        
        return resultat
    
    # CAS 2: UE Composite (composite=True)
    else:
        # 1. Récupérer les 2 UEs composantes
        ues_composantes = ue.ues_composantes.all()
        
        if ues_composantes.count() != 2:
            raise ValueError("Une UE composite doit avoir exactement 2 composantes")
        
        # 2. Calculer les résultats de chaque composante
        resultats_composantes = []
        for ue_comp in ues_composantes:
            resultat_comp = calculer_validation_ue(etudiant, ue_comp, inscription)
            resultats_composantes.append({
                'code': ue_comp.code,
                'libelle': ue_comp.libelle,
                'moyenne': resultat_comp.moyenne,
                'validee_individuellement': resultat_comp.est_valide
            })
        
        # 3. Appliquer la règle composite (min 7 et max 10)
        moy1 = resultats_composantes[0]['moyenne']
        moy2 = resultats_composantes[1]['moyenne']
        
        # Règle : l'une >= 7 ET l'autre >= 10
        composite_valide = (
            (moy1 >= 7 and moy2 >= 10) or 
            (moy1 >= 10 and moy2 >= 7)
        )
        
        # 4. Mettre à jour les ResultatUE des composantes selon la règle composite
        for i, ue_comp in enumerate(ues_composantes):
            resultat_comp = ResultatUE.objects.get(
                etudiant=etudiant,
                ue=ue_comp,
                inscription=inscription
            )
            
            # Si le composite est validé, on marque les composantes comme validées
            if composite_valide:
                resultat_comp.est_valide = True
                resultat_comp.credits_obtenus = ue_comp.nbre_credit
            else:
                # Sinon, validation individuelle normale (>= 10)
                resultat_comp.est_valide = resultats_composantes[i]['moyenne'] >= 10
                resultat_comp.credits_obtenus = ue_comp.nbre_credit if resultat_comp.est_valide else 0
            
            resultat_comp.save()
        
        # 5. Créer le ResultatUE pour l'UE composite
        moyenne_composite = (moy1 + moy2) / 2  # ou somme pondérée selon tes règles
        
        credits_obtenus = ue.nbre_credit if composite_valide else 0
        
        details = {
            'composantes': resultats_composantes,
            'regle': '7-10',
            'composite_valide': composite_valide
        }
        
        resultat, created = ResultatUE.objects.update_or_create(
            etudiant=etudiant,
            ue=ue,
            inscription=inscription,
            defaults={
                'moyenne': moyenne_composite,
                'est_valide': composite_valide,
                'credits_obtenus': credits_obtenus,
                'details_validation': details
            }
        )
        
        return resultat


def calculer_moyenne_ponderee(notes):
    """
    Calcule la moyenne pondérée à partir des notes
    """
    if not notes.exists():
        return 0
    
    total_poids = sum(note.evaluation.poids for note in notes)
    if total_poids == 0:
        return 0
    
    somme_ponderee = sum(note.note * note.evaluation.poids for note in notes)
    return round(somme_ponderee / total_poids, 2)
    


def calculer_tous_resultats_ue(ue):
    """
    Calcule les résultats pour tous les étudiants inscrits à une UE donnée.
    Retourne un dictionnaire avec les résultats et les éventuelles erreurs.
    """
    # Récupérer tous les étudiants inscrits à cette UE
    etudiants = Etudiant.objects.filter(inscriptions__ues=ue).distinct()
    
    resultats_crees = 0
    erreurs = []
    
    for etudiant in etudiants:
        # Récupérer l'inscription active de l'étudiant pour cette UE
        inscription = Inscription.objects.filter(
            etudiant=etudiant,
            ues=ue
        ).first()
        
        if not inscription:
            erreurs.append({
                'etudiant': etudiant.num_carte,
                'erreur': "Pas d'inscription trouvée pour cette UE"
            })
            continue
        
        try:
            # Calculer le résultat pour cet étudiant et cette UE
            resultat = calculer_validation_ue(etudiant, ue, inscription)
            resultats_crees += 1
        except Exception as e:
            erreurs.append({
                'etudiant': etudiant.num_carte,
                'erreur': str(e)
            })
    
    return {
        'resultats_crees': resultats_crees,
        'erreurs': erreurs if erreurs else None
    }


def obtenir_resultats_etudiant(etudiant):
    """
    Récupère tous les résultats d'un étudiant.
    """
    return ResultatUE.objects.filter(etudiant=etudiant).select_related('ue', 'inscription')


def obtenir_ues_validees(etudiant, inscription=None):
    """
    Récupère la liste des UEs validées pour un étudiant.
    Si inscription est spécifiée, filtre par cette inscription.
    """
    queryset = ResultatUE.objects.filter(
        etudiant=etudiant,
        est_valide=True
    )
    
    if inscription:
        queryset = queryset.filter(inscription=inscription)
    
    return queryset.select_related('ue')