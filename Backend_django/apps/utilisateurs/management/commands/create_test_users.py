from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from apps.utilisateurs.models import Utilisateur, Etudiant, RespInscription
from apps.inscription_pedagogique.models import (
    Parcours, Filiere, AnneeAcademique, AnneeEtude, Inscription
)
from datetime import datetime

class Command(BaseCommand):
    help = 'Crée des utilisateurs de test (étudiants et responsable)'

    def handle(self, *args, **kwargs):
        try:
            # 1. Créer le responsable d'inscription
            resp_user = Utilisateur.objects.create(
                username='respinsc',
                password=make_password('Resp@2023'),
                first_name='Robert',
                last_name='HOUSOUN',
                email='rhousoun@epl.tg',
                role='resp_inscription',
                sexe='M'
            )
            
            RespInscription.objects.create(
                utilisateur=resp_user
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Responsable inscription créé: {resp_user.username}')
            )

            # 2. Récupérer les objets existants nécessaires pour l'inscription
            try:
                parcours = Parcours.objects.get(libelle="Licence Professionnelle")
                filiere = Filiere.objects.get(nom="Génie Logiciel")
                annee_academique = AnneeAcademique.objects.get(est_active=True)
                annee_etude = AnneeEtude.objects.get(libelle="Licence 1")
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING('Attention: Certaines données de base sont manquantes. Les inscriptions ne seront pas créées.')
                )
                parcours = filiere = annee_academique = annee_etude = None

            # 7. Liste des étudiants à créer
            etudiants = [
            {
                    'username': 'thibaute',
                    'password': 'Etudiant@2000',
                    'first_name': 'ZODJIHOUE',
                    'last_name': 'abla',
                    'email': 'zthibaute2003@gmail.com',
                    'role': 'etudiant',
                'sexe': 'M',
                    'num_carte': 569103,
                    'autre_prenom': 'thibaute',
                    'date_naiss': '2003-07-08',
                    'lieu_naiss': 'lome',
                'is_validated': False
                },
                {
                    'username': 'lena',
                    'password': 'Etudiant@2001',
                    'first_name': 'AGBEGNINOU',
                    'last_name': 'akossiwa',
                    'email': 'lenaagbegninou02@gmail.com',
                    'role': 'etudiant',
                    'sexe': 'F',
                    'num_carte': 698547,
                    'autre_prenom': 'lena',
                    'date_naiss': '2005-07-18',
                    'lieu_naiss': 'Douala',
                    'is_validated': True
                },
                # Nouveaux étudiants 
                {
                    'username': 'mario',
                    'password': 'Etudiant@2002',
                    'first_name': 'Paul',
                    'last_name': 'Martin',
                    'email': 'paul.martin@example.com',
                    'role': 'etudiant',
                    'sexe': 'M',
                    'num_carte': 20022002,
                    'autre_prenom': 'Jacques',
                    'date_naiss': '2002-06-10',
                    'lieu_naiss': 'Bafoussam',
                    'is_validated': False
                },
                {
                    'username': '23V2003',
                    'password': 'Etudiant@2003',
                    'first_name': 'Sophie',
                    'last_name': 'Dubois',
                    'email': 'sophie.dubois@example.com',
                    'role': 'etudiant',
                    'sexe': 'F',
                    'num_carte': 20032003,
                    'autre_prenom': 'Louise',
                    'date_naiss': '2003-09-25',
                    'lieu_naiss': 'Kribi',
                    'is_validated': False
                }
            ]

            # 8. Créer les étudiants et leurs inscriptions
            for etudiant_data in etudiants:
                # Créer l'utilisateur de base
                utilisateur = Utilisateur.objects.create(
                    username=etudiant_data['username'],
                    password=make_password(etudiant_data['password']),
                    first_name=etudiant_data['first_name'],
                    last_name=etudiant_data['last_name'],
                    email=etudiant_data['email'],
                    role=etudiant_data['role'],
                    sexe=etudiant_data['sexe']
                )

                # Créer le profil étudiant
                etudiant = Etudiant.objects.create(
                    utilisateur=utilisateur,
                    num_carte=etudiant_data['num_carte'],
                    autre_prenom=etudiant_data['autre_prenom'],
                    date_naiss=datetime.strptime(etudiant_data['date_naiss'], '%Y-%m-%d'),
                    lieu_naiss=etudiant_data['lieu_naiss'],
                    is_validated=etudiant_data['is_validated']
                )

                # Créer une inscription pour les étudiants validés
                if etudiant_data['is_validated']:
                    Inscription.objects.create(
                        numero=f"INS-{etudiant_data['username']}",
                        etudiant=etudiant,
                        parcours=parcours,
                        annee_etude=annee_etude,
                        filiere=filiere,
                        anneeAcademique=annee_academique
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Créé: {utilisateur.username} ({etudiant_data['is_validated'] and 'Ancien' or 'Nouveau'})"
                    )
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur: {str(e)}')
            )
            