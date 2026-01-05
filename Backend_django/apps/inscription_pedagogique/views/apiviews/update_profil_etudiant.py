# ✅ BACKEND - views.py (Version JSON uniquement)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.files.base import ContentFile
from django.db import transaction
from apps.utilisateurs.models import Etudiant, Utilisateur
from apps.inscription_pedagogique.models import Inscription, AnneeAcademique
import base64
import uuid

# 1️⃣ MISE À JOUR DU PROFIL (JSON avec photo en Base64)
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profil_etudiant(request):
    """
    Met à jour le profil d'un étudiant connecté
    Reçoit TOUT en JSON (y compris la photo en Base64)
    """
    try:
        etudiant = Etudiant.objects.select_related('utilisateur').get(utilisateur=request.user)
    except Etudiant.DoesNotExist:
        return Response({"error": "Profil étudiant non trouvé"}, status=404)
    
    user = etudiant.utilisateur
    data = request.data
    modifications = []
    
    # 🔹 Téléphone
    if 'telephone' in data:
        user.telephone = data['telephone']
        modifications.append(f"Téléphone: {user.telephone}")
    
    # 🔹 Photo (Base64)
    if 'photo' in data and data['photo']:
        try:
            # Format attendu: "data:image/jpeg;base64,/9j/4AAQ..."
            photo_data = data['photo']
            
            # Extraire les données Base64
            if ',' in photo_data:
                header, encoded = photo_data.split(',', 1)
                # Extraire l'extension du MIME type
                if 'image/' in header:
                    ext = header.split('image/')[1].split(';')[0]
                else:
                    ext = 'jpg'
            else:
                encoded = photo_data
                ext = 'jpg'
            
            # Décoder Base64
            photo_bytes = base64.b64decode(encoded)
            
            # Créer un nom de fichier unique
            filename = f"photo_{etudiant.id}_{uuid.uuid4().hex[:8]}.{ext}"
            
            # Supprimer l'ancienne photo
            if etudiant.photo:
                try:
                    etudiant.photo.delete(save=False)
                except:
                    pass
            
            # Sauvegarder la nouvelle photo
            etudiant.photo.save(filename, ContentFile(photo_bytes), save=False)
            modifications.append(f"Photo: {filename}")
            
        except Exception as photo_error:
            print(f"⚠️ Erreur traitement photo: {photo_error}")
            return Response({
                "error": f"Erreur lors du traitement de la photo: {str(photo_error)}"
            }, status=400)
    
    # 🔹 Champs pour NOUVEAUX étudiants uniquement
    if 'date_naiss' in data:
        etudiant.date_naiss = data['date_naiss']
        modifications.append(f"Date naissance: {etudiant.date_naiss}")
    
    if 'lieu_naiss' in data:
        etudiant.lieu_naiss = data['lieu_naiss']
        modifications.append(f"Lieu naissance: {etudiant.lieu_naiss}")
    
    if 'autre_prenom' in data:
        etudiant.autre_prenom = data['autre_prenom']
        modifications.append(f"Autre prénom: {etudiant.autre_prenom}")
    
    if 'num_carte' in data:
        etudiant.num_carte = data['num_carte']
        modifications.append(f"Numéro carte: {etudiant.num_carte}")
    
    if 'sexe' in data:
        user.sexe = data['sexe']
        modifications.append(f"Sexe: {user.sexe}")
    
    # Sauvegarder
    user.save()
    etudiant.save()
    
    return Response({
        "success": True,
        "message": "Profil mis à jour avec succès",
        "modifications": modifications
    })


# 2️⃣ INSCRIPTION NOUVEAU ÉTUDIANT
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def inscription_nouveau_etudiant(request):
    """
    Finalise l'inscription d'un nouveau étudiant
    """
    data = request.data
    
    try:
        etudiant = Etudiant.objects.get(utilisateur=request.user)
    except Etudiant.DoesNotExist:
        return Response({"error": "Étudiant non trouvé"}, status=404)
    
    # Année académique active
    annee_active = AnneeAcademique.objects.filter(est_active=True).first()
    if not annee_active:
        return Response({"error": "Aucune année académique active"}, status=400)
    
    # Vérifier si déjà inscrit
    if Inscription.objects.filter(etudiant=etudiant, anneeAcademique=annee_active).exists():
        return Response({
            "error": f"Vous êtes déjà inscrit pour l'année {annee_active.libelle}"
        }, status=400)
    
    # Créer l'inscription
    numero = f"INS-{etudiant.num_carte or etudiant.id}-{annee_active.libelle.replace('/', '-')}"
    
    inscription = Inscription.objects.create(
        etudiant=etudiant,
        parcours_id=data['parcours_id'],
        filiere_id=data['filiere_id'],
        annee_etude_id=data['annee_etude_id'],
        anneeAcademique=annee_active,
        numero=numero
    )
    
    # Ajouter les UE
    ues_ids = data.get('ues_selectionnees', [])
    if ues_ids:
        inscription.ues.add(*ues_ids)
    
    return Response({
        "success": True,
        "message": "Inscription finalisée avec succès",
        "inscription_numero": inscription.numero,
        "ues_count": len(ues_ids)
    }, status=201)