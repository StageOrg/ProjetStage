# Create your views here.
from django.shortcuts import render
from rest_framework import viewsets
from apps.inscription_pedagogique.models import AnneeAcademique, AnneeEtude, Filiere, Parcours, Etablissement, Departement, Inscription, PeriodeInscription, Semestre 
from apps.inscription_pedagogique.serializers import AnneeAcademiqueSerializer, AnneeEtudeSerializer, FiliereSerializer,  ParcoursSerializer, EtablissementSerializer, DepartementSerializer, InscriptionSerializer, PeriodeInscriptionSerializer, SemestreSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny

# AJOUTE CES IMPORTS
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from apps.utilisateurs.models import Etudiant, Utilisateur
from apps.page_professeur.models import UE, Note

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

 # VÉRIFICATION D'ANCIEN ÉTUDIANT -

# Correction de la fonction verifier_ancien_etudiant

@api_view(['GET'])
@permission_classes([AllowAny])
def verifier_ancien_etudiant(request, num_carte):
    """
    Vérifie si un numéro de carte existe déjà pour les anciens étudiants
    et retourne toutes les informations nécessaires pour la réinscription
    """
    try:
        # Récupérer l'étudiant avec toutes les relations nécessaires
        etudiant = Etudiant.objects.select_related(
            'utilisateur'
        ).filter(num_carte=num_carte).first()
        
        if not etudiant:
            return Response({
                'existe': False, 
                'message': 'Numéro de carte non trouvé'
            }, status=404)
        
        # Récupérer la dernière inscription de l'étudiant
        derniere_inscription = Inscription.objects.filter(
            etudiant=etudiant
        ).select_related(
            'parcours', 'filiere', 'annee_etude', 'anneeAcademique'
        ).order_by('-anneeAcademique__libelle').first()
        
        # Fonction helper pour créer les données étudiant sécurisées
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
                'photo_url': etudiant.photo.url if etudiant.photo else None
            }
        
        if not derniere_inscription:
            return Response({
                'existe': True,
                'etudiant': get_etudiant_data(),
                'derniere_inscription': None,
                'prochaine_annee': None,
                'ues_disponibles': [],
                'ues_validees': []
            })
        
        # Récupérer toutes les notes de l'étudiant et calculer les UE validées
        ues_validees = []
        notes_par_ue = {}
        
        # Récupérer toutes les notes de l'étudiant
        notes = Note.objects.filter(etudiant=etudiant).select_related('evaluation', 'evaluation__ue')
        
        # Grouper les notes par UE et calculer les moyennes
        for note in notes:
            ue_id = note.evaluation.ue.id
            if ue_id not in notes_par_ue:
                notes_par_ue[ue_id] = {
                    'notes': [],
                    'poids': [],
                    'ue': note.evaluation.ue
                }
            notes_par_ue[ue_id]['notes'].append(note.note)
            notes_par_ue[ue_id]['poids'].append(note.evaluation.poids)
        
        # Calculer les moyennes pondérées et déterminer les UE validées
        for ue_id, data in notes_par_ue.items():
            if data['notes']:
                # Calcul de la moyenne pondérée
                total_poids = sum(data['poids'])
                if total_poids > 0:
                    moyenne = sum(note * poids for note, poids in zip(data['notes'], data['poids'])) / total_poids
                    if moyenne >= 10:
                        ues_validees.append(ue_id)
        
        # Déterminer la prochaine année d'étude
        annee_etude_actuelle = derniere_inscription.annee_etude
        ordre_annees = {
            'Licence 1': 1, 'Licence 2': 2, 'Licence 3': 3,
            'Master 1': 4, 'Master 2': 5
        }
        
        ordre_actuel = ordre_annees.get(annee_etude_actuelle.libelle, 0)
        prochaine_annee = None
        
        if ordre_actuel < 5:  # S'il n'est pas en Master 2
            # Chercher la prochaine année d'étude
            for libelle, ordre in ordre_annees.items():
                if ordre == ordre_actuel + 1:
                    prochaine_annee = AnneeEtude.objects.filter(libelle=libelle).first()
                    break
        
        # Récupérer les UE disponibles pour la prochaine année (non validées)
        ues_disponibles = []
        if prochaine_annee:
            ues_disponibles = UE.objects.filter(
                parcours=derniere_inscription.parcours,
                filiere=derniere_inscription.filiere,
                annee_etude=prochaine_annee
            ).exclude(id__in=ues_validees)
        
        return Response({
            'existe': True,
            'etudiant': get_etudiant_data(),  # Données sécurisées
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
                    'description': ue.description
                } for ue in ues_disponibles
            ],
            'ues_validees': ues_validees
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
        
        # VÉRIFICATION CRUCIALE: L'étudiant est-il déjà inscrit cette année ?
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
        
        # Récupérer la dernière inscription (OBLIGATOIRE pour un ancien étudiant)
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
        
        # Générer un numéro d'inscription unique
        numero_inscription = f"INS-{etudiant.num_carte}-{annee_academique.libelle}"
        
        # Créer la nouvelle inscription (même parcours et filière)
        nouvelle_inscription = Inscription.objects.create(
            numero=numero_inscription,
            etudiant=etudiant,
            parcours=derniere_inscription.parcours,  # Même parcours
            filiere=derniere_inscription.filiere,    # Même filière
            annee_etude=prochaine_annee,              # Année suivante
            anneeAcademique=annee_academique
        )
        
        # Ajouter les UE sélectionnées
        ues_selectionnees = data.get('ues_selectionnees', [])
        if not ues_selectionnees:
            return Response({'error': "Aucune UE sélectionnée"}, status=400)
            
        ues_ajoutees = 0
        for ue_id in ues_selectionnees:
            try:
                ue = UE.objects.get(id=ue_id)
                nouvelle_inscription.ues.add(ue)
                ues_ajoutees += 1
            except UE.DoesNotExist:
                print(f"UE {ue_id} non trouvée, ignorée")
                continue
        
        # Vérifier qu'au moins une UE a été ajoutée
        if ues_ajoutees == 0:
            nouvelle_inscription.delete()  # Supprimer l'inscription si aucune UE valide
            return Response({'error': "Aucune UE valide sélectionnée"}, status=400)
        
        # Sauvegarder
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