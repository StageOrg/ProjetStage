from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from datetime import datetime
from apps.utilisateurs.models import Utilisateur, Etudiant
from apps.inscription_pedagogique.models import Parcours, Filiere, AnneeAcademique, AnneeEtude, Inscription

class Command(BaseCommand):
    help = 'Crée un ancien étudiant de test'

    def handle(self, *args, **kwargs):
        try:
            # Récupérer ou créer les objets nécessaires
            parcours, _ = Parcours.objects.get_or_create(id=2, defaults={'libelle': 'Licence Professionnelle'})
            filiere, _ = Filiere.objects.get_or_create(id=1, defaults={'nom': 'Génie Logiciel'})
            annee_etude, _ = AnneeEtude.objects.get_or_create(id=1, defaults={'libelle': 'Licence 1'})
            annee_academique, _ = AnneeAcademique.objects.get_or_create(id=2, defaults={'libelle': '2024-2025'})

            # Données de l'étudiant
            etudiant_data = {
                'username': 'thibaute',
                'password': 'Etudiant@2000',
                'first_name': 'ZODJIHOUE',
                'last_name': 'Abla',
                'email': 'joyce0206@gmail.com',
                'role': 'etudiant',
                'sexe': 'M',
                'num_carte': 569103,
                'autre_prenom': 'Thibaute',
                'date_naiss': '2003-07-08',
                'lieu_naiss': 'Lomé',
                'is_validated': True  
                
            }

            # Vérifier si l'utilisateur existe déjà pour éviter les doublons
            utilisateur, created = Utilisateur.objects.get_or_create(
                username=etudiant_data['username'],
                defaults={
                    'password': make_password(etudiant_data['password']),
                    'first_name': etudiant_data['first_name'],
                    'last_name': etudiant_data['last_name'],
                    'email': etudiant_data['email'],
                    'role': etudiant_data['role'],
                    'sexe': etudiant_data['sexe']
                }
            )

            # Créer ou récupérer le profil étudiant
            etudiant, _ = Etudiant.objects.get_or_create(
                utilisateur=utilisateur,
                defaults={
                    'num_carte': etudiant_data['num_carte'],
                    'autre_prenom': etudiant_data['autre_prenom'],
                    'date_naiss': datetime.strptime(etudiant_data['date_naiss'], '%Y-%m-%d'),
                    'lieu_naiss': etudiant_data['lieu_naiss'],
                    'is_validated': etudiant_data['is_validated']
                }
            )

            # Créer l'inscription si elle n'existe pas
            Inscription.objects.get_or_create(
                numero=f"INS-{etudiant.num_carte}",
                etudiant=etudiant,
                defaults={
                    'parcours': parcours,
                    'filiere': filiere,
                    'annee_etude': annee_etude,
                    'anneeAcademique': annee_academique
                }
            )

            self.stdout.write(self.style.SUCCESS(f"Ancien étudiant 1 créé ou récupéré: {utilisateur.username}"))

            # --- DEUXIÈME ANCIEN ÉTUDIANT ---
            etudiant_data_2 = {
                'username': 'jean',
                'password': 'Etudiant@2002',
                'first_name': 'KOFFI',
                'last_name': 'Jean',
                'email': 'jean.koffi@gmail.com',
                'role': 'etudiant',
                'sexe': 'M',
                'num_carte': 884799,
                'autre_prenom': 'jules',
                'date_naiss': '2002-05-15',
                'lieu_naiss': 'Kara',
                'is_validated': False
            }

            user2, _ = Utilisateur.objects.get_or_create(
                username=etudiant_data_2['username'],
                defaults={
                    'password': make_password(etudiant_data_2['password']),
                    'first_name': etudiant_data_2['first_name'],
                    'last_name': etudiant_data_2['last_name'],
                    'email': etudiant_data_2['email'],
                    'role': etudiant_data_2['role'],
                    'sexe': etudiant_data_2['sexe']
                }
            )

            etu2, _ = Etudiant.objects.get_or_create(
                utilisateur=user2,
                defaults={
                    'num_carte': etudiant_data_2['num_carte'],
                    'autre_prenom': etudiant_data_2['autre_prenom'],
                    'date_naiss': datetime.strptime(etudiant_data_2['date_naiss'], '%Y-%m-%d'),
                    'lieu_naiss': etudiant_data_2['lieu_naiss'],
                    'is_validated': etudiant_data_2['is_validated']
                }
            )

            Inscription.objects.get_or_create(
                numero=f"INS-{etu2.num_carte}",
                etudiant=etu2,
                defaults={
                    'parcours': parcours,
                    'filiere': filiere,
                    'annee_etude': annee_etude,
                    'anneeAcademique': annee_academique
                }
            )
            
            self.stdout.write(self.style.SUCCESS(f"Ancien étudiant 2 créé ou récupéré: {user2.username}"))

            self.stdout.write(self.style.SUCCESS(f"Ancien étudiant créé ou récupéré: {utilisateur.username}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erreur: {str(e)}"))
