# Create your views here.
from django.shortcuts import render
from rest_framework import viewsets
from apps.inscription_pedagogique.models import AnneeAcademique, AnneeEtude, Filiere, Parcours, Etablissement, Departement, Inscription, PeriodeInscription, Semestre 
from apps.inscription_pedagogique.serializers import AnneeAcademiqueSerializer, AnneeEtudeSerializer, FiliereSerializer,  ParcoursSerializer, EtablissementSerializer, DepartementSerializer, InscriptionSerializer, PeriodeInscriptionSerializer, SemestreSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from apps.utilisateurs.models import Etudiant, Utilisateur
from apps.page_professeur.models import UE, Note, ResultatUE
from apps.page_professeur.services import obtenir_ues_validees

class AnneeAcademiqueViewSet(viewsets.ModelViewSet):
    queryset = AnneeAcademique.objects.all().order_by('libelle')
    serializer_class = AnneeAcademiqueSerializer
    pagination_class = None


class SemestreViewSet(viewsets.ModelViewSet):
    queryset = Semestre.objects.all()
    serializer_class = SemestreSerializer

class ParcoursViewSet(viewsets.ModelViewSet):
    queryset = Parcours.objects.all()
    serializer_class = ParcoursSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Lecture publique
        return [IsAuthenticated()]  # Écriture protégée

class FiliereViewSet(viewsets.ModelViewSet):
    queryset = Filiere.objects.all()
    serializer_class = FiliereSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class AnneeEtudeViewSet(viewsets.ModelViewSet):
    queryset = AnneeEtude.objects.all()
    serializer_class = AnneeEtudeSerializer
    pagination_class = None
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class EtablissementViewSet(viewsets.ModelViewSet):
    queryset = Etablissement.objects.all()
    serializer_class = EtablissementSerializer

class DepartementViewSet(viewsets.ModelViewSet):
    queryset = Departement.objects.all()
    serializer_class = DepartementSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etablissement']

class InscriptionViewSet(viewsets.ModelViewSet):
    queryset = Inscription.objects.all()
    serializer_class = InscriptionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etudiant', 'parcours', 'filiere', 'annee_etude', 'anneeAcademique']

class PeriodeInscriptionViewSet(viewsets.ModelViewSet):
    queryset = PeriodeInscription.objects.all()
    serializer_class = PeriodeInscriptionSerializer
    pagination_class = None

 # VÉRIFICATION D'ANCIEN ÉTUDIANT -
@api_view(['GET'])
@permission_classes([AllowAny])
def verifier_ancien_etudiant(request, num_carte):
    """
    Vérifie si un numéro de carte existe déjà pour les anciens étudiants
    et retourne toutes les informations nécessaires pour la réinscription
    """
    try:
        # Récupérer l'étudiant
        etudiant = Etudiant.objects.select_related('utilisateur').filter(num_carte=num_carte).first()
        
        if not etudiant:
            return Response({
                'existe': False, 
                'message': 'Numéro de carte non trouvé'
            }, status=404)
        
        # Récupérer la dernière inscription
        derniere_inscription = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related(
            'parcours', 'filiere', 'annee_etude', 'anneeAcademique'
        ).order_by('-anneeAcademique__libelle').first()
        
        # Fonction helper pour créer les données étudiant
        def get_etudiant_data():
            return {
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
                'photo': etudiant.photo.url if etudiant.photo else None
            }
        
        if not derniere_inscription:
            return Response({
                'existe': True,
                'etudiant': get_etudiant_data(),
                'derniere_inscription': None,
                'prochaine_annee': None,
                'ues_disponibles': [],
                'ues_validees': [],
                'ues_non_validees': []
            })
        
        # Récupérer les UEs validées et non validées via ResultatUE
        resultats_ues = ResultatUE.objects.filter(
            etudiant=etudiant,
            inscription=derniere_inscription
        ).select_related('ue')
        
        ues_validees = resultats_ues.filter(est_valide=True)
        ues_non_validees = resultats_ues.filter(est_valide=False)
        
        # Déterminer la prochaine année d'étude
        annee_etude_actuelle = derniere_inscription.annee_etude
        ordre_annees = {
            'Licence 1': 1, 'Licence 2': 2, 'Licence 3': 3,
            'Master 1': 4, 'Master 2': 5
        }
        
        ordre_actuel = ordre_annees.get(annee_etude_actuelle.libelle, 0)
        prochaine_annee = None
        
        if ordre_actuel < 5:  # S'il n'est pas en Master 2
            for libelle, ordre in ordre_annees.items():
                if ordre == ordre_actuel + 1:
                    prochaine_annee = AnneeEtude.objects.filter(libelle=libelle).first()
                    break
        
        # Récupérer les UEs disponibles pour la prochaine année (non validées)
        ues_disponibles = []
        if prochaine_annee:
            ues_disponibles = UE.objects.filter(
                parcours=derniere_inscription.parcours,
                filiere=derniere_inscription.filiere,
                annee_etude=prochaine_annee
            ).exclude(id__in=ues_validees.values_list('ue_id', flat=True))
        
        # Inclure les UEs non validées de l'inscription précédente
        ues_disponibles = ues_disponibles | UE.objects.filter(
            id__in=ues_non_validees.values_list('ue_id', flat=True)
        )
        
        return Response({
            'existe': True,
            'etudiant': get_etudiant_data(),
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
            'ues_disponibles': [
                {
                    'id': ue.id,
                    'libelle': ue.libelle,
                    'code': ue.code,
                    'nbre_credit': ue.nbre_credit,
                    'description': ue.description,
                    'composite': ue.composite,
                    'composantes': [
                        {'id': comp.id, 'code': comp.code, 'libelle': comp.libelle, 'nbre_credit': comp.nbre_credit}
                        for comp in ue.ues_composantes.all()
                    ] if ue.composite else []
                } for ue in ues_disponibles.distinct()
            ],
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
            'ues_non_validees': [
                {
                    'id': resultat.ue.id,
                    'code': resultat.ue.code,
                    'libelle': resultat.ue.libelle,
                    'nbre_credit': resultat.ue.nbre_credit,
                    'moyenne': resultat.moyenne,
                    'credits_obtenus': resultat.credits_obtenus,
                    'composite': resultat.ue.composite,
                    'details_validation': resultat.details_validation
                } for resultat in ues_non_validees
            ]
        })
        
    except Exception as e:
        print(f"Erreur dans verifier_ancien_etudiant: {str(e)}")
        return Response({
            'error': f'Erreur serveur: {str(e)}'
        }, status=500)
        
@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def inscription_ancien_etudiant(request):
    """
    Finalise l'inscription d'un ancien étudiant avec les UE choisies
    LOGIQUE: Un ancien étudiant a TOUJOURS une inscription précédente
    Vérifie qu'il n'est pas déjà inscrit pour l'année en cours
    """
    try:
        data = request.data
        
        # Vérifier que l'étudiant existe
        etudiant_id = data.get('etudiant_id')
        if not etudiant_id:
            return Response({'error': "ID étudiant manquant"}, status=400)
            
        etudiant = Etudiant.objects.get(id=etudiant_id)
        
        # Récupérer l'année académique active
        annee_academique = AnneeAcademique.objects.filter(est_active=True).first()
        if not annee_academique:
            return Response({'error': "Aucune année académique active"}, status=400)
        
        # Vérifier si l'étudiant est déjà inscrit cette année
        inscription_existante = Inscription.objects.filter(
            etudiant=etudiant,
            anneeAcademique=annee_academique
        ).first()
        
        if inscription_existante:
            return Response({
                'error': f"Vous êtes déjà inscrit pour l'année académique {annee_academique.libelle}",
                'details': {
                    'numero_inscription': inscription_existante.numero,
                    'date_inscription': inscription_existante.date,
                    'parcours': inscription_existante.parcours.libelle,
                    'filiere': inscription_existante.filiere.nom,
                    'annee_etude': inscription_existante.annee_etude.libelle
                }
            }, status=400)
        
        # Récupérer la dernière inscription
        derniere_inscription = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related('parcours', 'filiere', 'annee_etude').order_by('-anneeAcademique__libelle').first()
        
        if not derniere_inscription:
            return Response({'error': "Aucune inscription précédente trouvée. Cet étudiant n'est pas un ancien étudiant."}, status=400)
        
        # Déterminer la prochaine année d'étude
        prochaine_annee_id = data.get('prochaine_annee_id')
        if not prochaine_annee_id:
            return Response({'error': "Prochaine année d'étude manquante"}, status=400)
            
        prochaine_annee = AnneeEtude.objects.get(id=prochaine_annee_id)
        
        # Vérifier les UEs sélectionnées
        ues_selectionnees = data.get('ues_selectionnees', [])
        if not ues_selectionnees:
            return Response({'error': "Aucune UE sélectionnée"}, status=400)
            
        # Récupérer les UEs validées de l'étudiant
        ues_validees = obtenir_ues_validees(etudiant).values_list('ue_id', flat=True)
        
        # Récupérer les UEs disponibles (prochaine année + non validées)
        ues_non_validees = ResultatUE.objects.filter(
            etudiant=etudiant,
            est_valide=False
        ).values_list('ue_id', flat=True)
        
        ues_disponibles = UE.objects.filter(
            parcours=derniere_inscription.parcours,
            filiere=derniere_inscription.filiere,
            annee_etude=prochaine_annee
        ).exclude(id__in=ues_validees) | UE.objects.filter(id__in=ues_non_validees)
        
        ues_ajoutees = 0
        for ue_id in ues_selectionnees:
            try:
                ue = UE.objects.get(id=ue_id)
                # Vérifier que l'UE est disponible
                if ue.id not in ues_disponibles.values_list('id', flat=True):
                    return Response({
                        'error': f"L'UE {ue.code} n'est pas disponible pour cette inscription"
                    }, status=400)
                # Vérifier que l'UE n'est pas déjà validée
                if ue.id in ues_validees:
                    return Response({
                        'error': f"L'UE {ue.code} est déjà validée"
                    }, status=400)
                # Vérifier les composantes pour les UEs composites
                if ue.composite and ue.ues_composantes.count() != 2:
                    return Response({
                        'error': f"L'UE composite {ue.code} doit avoir exactement 2 composantes"
                    }, status=400)
            except UE.DoesNotExist:
                print(f"UE {ue_id} non trouvée, ignorée")
                continue
        
        # Générer un numéro d'inscription unique
        numero_inscription = f"INS-{etudiant.num_carte}-{annee_academique.libelle}"
        
        # Créer la nouvelle inscription
        nouvelle_inscription = Inscription.objects.create(
            numero=numero_inscription,
            etudiant=etudiant,
            parcours=derniere_inscription.parcours,
            filiere=derniere_inscription.filiere,
            annee_etude=prochaine_annee,
            anneeAcademique=annee_academique
        )
        
        # Ajouter les UEs sélectionnées
        for ue_id in ues_selectionnees:
            try:
                ue = UE.objects.get(id=ue_id)
                nouvelle_inscription.ues.add(ue)
                ues_ajoutees += 1
            except UE.DoesNotExist:
                continue
        
        if ues_ajoutees == 0:
            nouvelle_inscription.delete()
            return Response({'error': "Aucune UE valide sélectionnée"}, status=400)
        
        nouvelle_inscription.save()
        
        return Response({
            'success': True,
            'message': f'Inscription effectuée avec succès pour l\'année {annee_academique.libelle}',
            'inscription_id': nouvelle_inscription.id,
            'numero_inscription': nouvelle_inscription.numero,
            'ues_inscrites': ues_ajoutees,
            'annee_academique': annee_academique.libelle
        })
        
    except Etudiant.DoesNotExist:
        return Response({'error': "Étudiant non trouvé"}, status=404)
    except AnneeEtude.DoesNotExist:
        return Response({'error': "Année d'étude non trouvée"}, status=404)
    except Exception as e:
        print(f"Erreur dans inscription_ancien_etudiant: {str(e)}")
        return Response({'error': f'Erreur serveur: {str(e)}'}, status=500)
        
        
@api_view(['POST'])
@permission_classes([AllowAny])
def check_annee_etude(request):
    type_etudiant = request.data.get('type_etudiant', '')
    annee_etude_id = request.data.get('annee_etude_id')
    
    if not annee_etude_id:
        return Response(
            {'valide': False, 'message': 'Année d\'étude manquante'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        annee = AnneeEtude.objects.get(id=annee_etude_id)
    except AnneeEtude.DoesNotExist:
        return Response(
            {'valide': False, 'message': 'Année d\'étude introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if type_etudiant == 'nouveau':
        if annee.libelle != 'Licence 1':
            return Response({
                'valide': False,
                'message': 'Les nouveaux étudiants doivent commencer par Licence 1'
            })
    
    return Response({
        'valide': True,
        'message': 'Année d\'étude autorisée'
    })       