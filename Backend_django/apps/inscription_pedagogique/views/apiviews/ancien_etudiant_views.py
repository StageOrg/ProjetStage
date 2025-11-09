# apps/inscription_pedagogique/ancien_etudiant_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from apps.utilisateurs.models import Etudiant
from apps.inscription_pedagogique.models import Inscription, AnneeAcademique, AnneeEtude
from apps.page_professeur.models import UE, ResultatUE
from apps.page_professeur.services import obtenir_ues_validees


@api_view(['GET'])
@permission_classes([AllowAny])
def verifier_ancien_etudiant(request, num_carte):
    """
    Vérifie si un numéro de carte existe déjà pour les anciens étudiants
    et retourne toutes les informations nécessaires pour la réinscription.
    
    Utilisé par:
    - Les étudiants pour leur auto-inscription
    - Les admins pour inscrire des anciens étudiants
    
    GET /inscription/verifier-ancien-etudiant/{num_carte}/
    """
    try:
        # 1. Récupérer l'étudiant
        etudiant = Etudiant.objects.select_related('utilisateur').filter(
            num_carte=num_carte
        ).first()
        
        if not etudiant:
            return Response({
                'existe': False, 
                'message': f'Aucun étudiant trouvé avec le numéro de carte {num_carte}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 2. Récupérer la dernière inscription
        derniere_inscription = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related(
            'parcours', 'filiere', 'annee_etude', 'anneeAcademique'
        ).order_by('-anneeAcademique__libelle').first()
        
        # 3. Préparer les données de l'étudiant
        etudiant_data = {
            'id': etudiant.id,
            'utilisateur_id': etudiant.utilisateur.id,
            'username': etudiant.utilisateur.username,
            'num_carte': etudiant.num_carte,
            'nom': etudiant.utilisateur.last_name,
            'prenom': etudiant.utilisateur.first_name,
            'email': etudiant.utilisateur.email,
            'telephone': etudiant.utilisateur.telephone,
            'date_naissance': etudiant.date_naiss,
            'lieu_naissance': etudiant.lieu_naiss,
            'autre_prenom': etudiant.autre_prenom,
            'sexe': etudiant.utilisateur.sexe,
            'photo': etudiant.photo.url if etudiant.photo else None
        }
        
        # 4. Si pas d'inscription précédente (cas rare)
        if not derniere_inscription:
            return Response({
                'existe': True,
                'etudiant': etudiant_data,
                'derniere_inscription': None,
                'prochaine_annee': None,
                'ues_disponibles': [],
                'ues_validees': [],
                'ues_non_validees': [],
                'message': "Étudiant trouvé mais aucune inscription précédente. Ce n'est pas un ancien étudiant."
            })
        
        # 5. Vérifier s'il est déjà inscrit pour l'année en cours
        annee_active = AnneeAcademique.objects.filter(est_active=True).first()
        inscription_existante = None
        if annee_active:
            inscription_existante = Inscription.objects.filter(
                etudiant=etudiant,
                anneeAcademique=annee_active
            ).first()
        
        # 6. Récupérer les UEs validées et non validées via ResultatUE
        resultats_ues = ResultatUE.objects.filter(
            etudiant=etudiant,
            inscription=derniere_inscription
        ).select_related('ue')
        
        ues_validees = resultats_ues.filter(est_valide=True)
        ues_non_validees = resultats_ues.filter(est_valide=False)
        
        # 7. Déterminer la prochaine année d'étude
        ordre_annees = {
            'Licence 1': 1, 'Licence 2': 2, 'Licence 3': 3,
            'Master 1': 4, 'Master 2': 5
        }
        
        annee_etude_actuelle = derniere_inscription.annee_etude
        ordre_actuel = ordre_annees.get(annee_etude_actuelle.libelle, 0)
        prochaine_annee = None
        
        if ordre_actuel < 5:  # S'il n'est pas en Master 2
            for libelle, ordre in ordre_annees.items():
                if ordre == ordre_actuel + 1:
                    prochaine_annee = AnneeEtude.objects.filter(libelle=libelle).first()
                    break
        
        # 8. Récupérer les UEs de la prochaine année (non validées)
        ues_prochaine_annee = []
        if prochaine_annee:
            ues_prochaine_annee = UE.objects.filter(
                parcours=derniere_inscription.parcours,
                filiere=derniere_inscription.filiere,
                annee_etude=prochaine_annee
            ).exclude(id__in=ues_validees.values_list('ue_id', flat=True))
        
        # 9. Récupérer les UEs non validées de l'inscription précédente
        ues_nv_precedente = UE.objects.filter(
            id__in=ues_non_validees.values_list('ue_id', flat=True)
        )
        
        # 10. Combiner pour avoir toutes les UEs disponibles
        ues_disponibles = (ues_prochaine_annee | ues_nv_precedente).distinct()
        
        # 11. Préparer la réponse
        response_data = {
            'existe': True,
            'etudiant': etudiant_data,
            'derniere_inscription': {
                'id': derniere_inscription.id,
                'parcours': {
                    'id': derniere_inscription.parcours.id,
                    'libelle': derniere_inscription.parcours.libelle,
                    'abbreviation': derniere_inscription.parcours.abbreviation
                },
                'filiere': {
                    'id': derniere_inscription.filiere.id,
                    'nom': derniere_inscription.filiere.nom,
                    'abbreviation': derniere_inscription.filiere.abbreviation
                },
                'annee_etude': {
                    'id': derniere_inscription.annee_etude.id,
                    'libelle': derniere_inscription.annee_etude.libelle
                },
                'annee_academique': {
                    'id': derniere_inscription.anneeAcademique.id,
                    'libelle': derniere_inscription.anneeAcademique.libelle
                }
            },
            'prochaine_annee': {
                'id': prochaine_annee.id if prochaine_annee else None,
                'libelle': prochaine_annee.libelle if prochaine_annee else None
            } if prochaine_annee else None,
            
            # UEs disponibles (combiné)
            'ues_disponibles': [
                {
                    'id': ue.id,
                    'libelle': ue.libelle,
                    'code': ue.code,
                    'nbre_credit': ue.nbre_credit,
                    'description': ue.description,
                    'composite': ue.composite,
                    'composantes': [
                        {
                            'id': comp.id, 
                            'code': comp.code, 
                            'libelle': comp.libelle, 
                            'nbre_credit': comp.nbre_credit
                        }
                        for comp in ue.ues_composantes.all()
                    ] if ue.composite else []
                } for ue in ues_disponibles
            ],
            
            # UEs non validées (avec détails)
            'ues_non_validees': [
                {
                    'id': resultat.ue.id,
                    'code': resultat.ue.code,
                    'libelle': resultat.ue.libelle,
                    'nbre_credit': resultat.ue.nbre_credit,
                    'moyenne': resultat.moyenne,
                    'credits_obtenus': resultat.credits_obtenus,
                    'composite': resultat.ue.composite,
                    'details_validation': resultat.details_validation,
                    'annee_origine': derniere_inscription.annee_etude.libelle
                } for resultat in ues_non_validees
            ],
            
            # UEs validées (pour information)
            'ues_validees': [
                {
                    'id': resultat.ue.id,
                    'code': resultat.ue.code,
                    'libelle': resultat.ue.libelle,
                    'nbre_credit': resultat.ue.nbre_credit,
                    'moyenne': resultat.moyenne,
                    'credits_obtenus': resultat.credits_obtenus,
                    'composite': resultat.ue.composite,
                    'details_validation': resultat.details_validation
                } for resultat in ues_validees
            ],
            
            # Statistiques
            'total_credits_obtenus': sum(r.credits_obtenus for r in ues_validees),
            'nb_ues_validees': ues_validees.count(),
            'nb_ues_non_validees': ues_non_validees.count(),
        }
        
        # Ajouter l'info si déjà inscrit cette année
        if inscription_existante:
            response_data['inscription_existante'] = {
                'numero': inscription_existante.numero,
                'date': inscription_existante.date,
                'parcours': inscription_existante.parcours.libelle,
                'filiere': inscription_existante.filiere.nom,
                'annee_etude': inscription_existante.annee_etude.libelle,
                'annee_academique': inscription_existante.anneeAcademique.libelle,
                'message': f"Déjà inscrit pour l'année {annee_active.libelle}"
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Erreur dans verifier_ancien_etudiant: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def inscription_ancien_etudiant(request):
    """
    Finalise l'inscription d'un ancien étudiant avec les UE choisies.
    
    LOGIQUE: Un ancien étudiant a TOUJOURS une inscription précédente.
    Vérifie qu'il n'est pas déjà inscrit pour l'année en cours.
    
    POST /inscription/inscription-ancien-etudiant/
    
    Body:
    {
        "etudiant_id": 123,
        "prochaine_annee_id": 4,
        "ues_selectionnees": [1, 2, 3, 4]
    }
    """
    try:
        data = request.data
        
        # 1. Validation des paramètres
        etudiant_id = data.get('etudiant_id')
        prochaine_annee_id = data.get('prochaine_annee_id')
        ues_selectionnees = data.get('ues_selectionnees', [])
        
        if not etudiant_id:
            return Response({
                'error': "Le paramètre 'etudiant_id' est requis"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not prochaine_annee_id:
            return Response({
                'error': "Le paramètre 'prochaine_annee_id' est requis"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not ues_selectionnees:
            return Response({
                'error': "Au moins une UE doit être sélectionnée"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Vérifier que l'étudiant existe
        try:
            etudiant = Etudiant.objects.select_related('utilisateur').get(id=etudiant_id)
        except Etudiant.DoesNotExist:
            return Response({
                'error': f"Étudiant avec l'ID {etudiant_id} introuvable"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 3. Vérifier que l'année d'étude existe
        try:
            prochaine_annee = AnneeEtude.objects.get(id=prochaine_annee_id)
        except AnneeEtude.DoesNotExist:
            return Response({
                'error': f"Année d'étude avec l'ID {prochaine_annee_id} introuvable"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 4. Récupérer l'année académique active
        annee_academique = AnneeAcademique.objects.filter(est_active=True).first()
        if not annee_academique:
            return Response({
                'error': "Aucune année académique active. Veuillez contacter l'administration."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 5. Vérifier si l'étudiant est déjà inscrit cette année
        inscription_existante = Inscription.objects.filter(
            etudiant=etudiant,
            anneeAcademique=annee_academique
        ).first()
        
        if inscription_existante:
            return Response({
                'error': f"Cet étudiant est déjà inscrit pour l'année académique {annee_academique.libelle}",
                'details': {
                    'numero_inscription': inscription_existante.numero,
                    'date_inscription': inscription_existante.date.strftime('%d/%m/%Y') if inscription_existante.date else None,
                    'parcours': inscription_existante.parcours.libelle,
                    'filiere': inscription_existante.filiere.nom,
                    'annee_etude': inscription_existante.annee_etude.libelle
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 6. Récupérer la dernière inscription
        derniere_inscription = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related('parcours', 'filiere', 'annee_etude').order_by(
            '-anneeAcademique__libelle'
        ).first()
        
        if not derniere_inscription:
            return Response({
                'error': "Aucune inscription précédente trouvée. Cet étudiant n'est pas un ancien étudiant."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 7. Récupérer les UEs validées de l'étudiant
        ues_validees_ids = obtenir_ues_validees(etudiant).values_list('ue_id', flat=True)
        
        # 8. Récupérer les UEs non validées
        ues_non_validees_ids = ResultatUE.objects.filter(
            etudiant=etudiant,
            est_valide=False
        ).values_list('ue_id', flat=True)
        
        # 9. Construire la liste des UEs disponibles
        ues_disponibles = UE.objects.filter(
            parcours=derniere_inscription.parcours,
            filiere=derniere_inscription.filiere,
            annee_etude=prochaine_annee
        ).exclude(id__in=ues_validees_ids) | UE.objects.filter(id__in=ues_non_validees_ids)
        
        ues_disponibles_ids = list(ues_disponibles.values_list('id', flat=True))
        
        # 10. Valider les UEs sélectionnées
        ues_invalides = []
        ues_deja_validees = []
        
        for ue_id in ues_selectionnees:
            # Vérifier que l'UE existe
            try:
                ue = UE.objects.get(id=ue_id)
            except UE.DoesNotExist:
                ues_invalides.append(f"UE ID {ue_id} introuvable")
                continue
            
            # Vérifier que l'UE est disponible
            if ue.id not in ues_disponibles_ids:
                ues_invalides.append(f"{ue.code} - {ue.libelle} n'est pas disponible")
            
            # Vérifier que l'UE n'est pas déjà validée
            if ue.id in ues_validees_ids:
                ues_deja_validees.append(f"{ue.code} - {ue.libelle}")
            
            # Vérifier les composantes pour les UEs composites
            if ue.composite and ue.ues_composantes.count() != 2:
                ues_invalides.append(
                    f"{ue.code} - {ue.libelle} (UE composite incomplète)"
                )
        
        # Si des erreurs de validation
        if ues_invalides:
            return Response({
                'error': "Certaines UEs sélectionnées sont invalides",
                'ues_invalides': ues_invalides
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if ues_deja_validees:
            return Response({
                'error': "Certaines UEs sélectionnées sont déjà validées",
                'ues_deja_validees': ues_deja_validees
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 11. Générer un numéro d'inscription unique
        numero_inscription = f"INS-{etudiant.num_carte}-{annee_academique.libelle.replace('/', '-')}"
        
        # 12. Créer la nouvelle inscription
        nouvelle_inscription = Inscription.objects.create(
            numero=numero_inscription,
            etudiant=etudiant,
            parcours=derniere_inscription.parcours,
            filiere=derniere_inscription.filiere,
            annee_etude=prochaine_annee,
            anneeAcademique=annee_academique
        )
        
        # 13. Ajouter les UEs sélectionnées
        ues_ajoutees = 0
        ues_ajoutees_details = []
        
        for ue_id in ues_selectionnees:
            try:
                ue = UE.objects.get(id=ue_id)
                nouvelle_inscription.ues.add(ue)
                ues_ajoutees += 1
                ues_ajoutees_details.append({
                    'code': ue.code,
                    'libelle': ue.libelle,
                    'credits': ue.nbre_credit
                })
            except UE.DoesNotExist:
                print(f"⚠️ UE {ue_id} non trouvée lors de l'ajout, ignorée")
                continue
        
        # 14. Vérifier qu'au moins une UE a été ajoutée
        if ues_ajoutees == 0:
            nouvelle_inscription.delete()
            return Response({
                'error': "Aucune UE valide n'a pu être ajoutée à l'inscription"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 15. Sauvegarder
        nouvelle_inscription.save()
        
        # 16. Réponse de succès
        return Response({
            'success': True,
            'message': f'✅ Inscription réussie pour l\'année {annee_academique.libelle}',
            'inscription': {
                'id': nouvelle_inscription.id,
                'numero': nouvelle_inscription.numero,
                'etudiant': {
                    'nom': etudiant.utilisateur.get_full_name(),
                    'num_carte': etudiant.num_carte,
                    'email': etudiant.utilisateur.email
                },
                'parcours': derniere_inscription.parcours.libelle,
                'filiere': derniere_inscription.filiere.nom,
                'annee_etude': prochaine_annee.libelle,
                'annee_academique': annee_academique.libelle,
                'ues_inscrites': ues_ajoutees,
                'ues_details': ues_ajoutees_details,
                'total_credits': sum(ue['credits'] for ue in ues_ajoutees_details)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Erreur dans inscription_ancien_etudiant: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Erreur serveur: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def check_annee_etude(request):
    """
    Vérifie si une année d'étude est valide selon le type d'étudiant.
    
    POST /inscription/check-annee-etude/
    
    Body:
    {
        "type_etudiant": "nouveau" | "ancien",
        "annee_etude_id": 1
    }
    """
    type_etudiant = request.data.get('type_etudiant', '')
    annee_etude_id = request.data.get('annee_etude_id')
    
    if not annee_etude_id:
        return Response({
            'valide': False, 
            'message': 'Le paramètre annee_etude_id est requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        annee = AnneeEtude.objects.get(id=annee_etude_id)
    except AnneeEtude.DoesNotExist:
        return Response({
            'valide': False, 
            'message': f'Année d\'étude avec l\'ID {annee_etude_id} introuvable'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Règle: Les nouveaux étudiants doivent commencer par Licence 1
    if type_etudiant == 'nouveau':
        if annee.libelle != 'Licence 1':
            return Response({
                'valide': False,
                'message': 'Les nouveaux étudiants doivent obligatoirement commencer en Licence 1',
                'annee_actuelle': annee.libelle,
                'annee_requise': 'Licence 1'
            }, status=status.HTTP_200_OK)
    
    return Response({
        'valide': True,
        'message': f'Année d\'étude {annee.libelle} autorisée pour {type_etudiant}',
        'annee': {
            'id': annee.id,
            'libelle': annee.libelle
        }
    }, status=status.HTTP_200_OK)