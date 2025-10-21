
from rest_framework.permissions import BasePermission
from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Verifier si la requête provient de l'intranet
class IsIntranet(BasePermission):
    def has_permission(self, request, view):
        ip = request.META.get('REMOTE_ADDR', '')
        return ip.startswith('192.168.') or ip.startswith('10.')
        
        
# Permissions pour les utilisateurs
class IsValidated(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_validated
        
        
# Permissions pour les professeurs 
class IsProfesseur(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'professeur')


# Permissions pour les responsables de saisie de notes
class IsResponsableNotes(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'resp_notes')

# Permissions pour les étudiants
class IsEtudiant(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'etudiant')
    

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.method in permissions.SAFE_METHODS
            or request.user and request.user.is_staff
        )


class IsSelfOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj or request.user.is_staff

#Autorise tous à lire, mais seul le professeur propriétaire peut modifier, supprimer.
class IsOwnerOrReadOnlyForProf(BasePermission):
    """
    - Lecture autorisée à tous les utilisateurs authentifiés.
    - Écriture autorisée seulement au professeur propriétaire.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return hasattr(user, 'professeur') and obj.professeur == user.professeur
    
    
#Permet lecture à tous, et écriture uniquement au prof ou à la secrétaire.
class IsProfOrSecretaire(BasePermission):
    """
    - Lecture autorisée à tous.
    - Modification autorisée au professeur ou à la secrétaire.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return (
            hasattr(user, 'professeur') and obj.evaluation.professeur == user.professeur
        ) or hasattr(user, 'secretaire')
        

#Tout le monde peut voir, mais seuls admin et resp_notes peuvent modifier.
class IsAdminOrRespNotesOnly(BasePermission):
    """
    - Lecture pour tous les utilisateurs authentifiés.
    - Écriture réservée à admin ou responsable des notes.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return user.is_staff or hasattr(user, 'resp_notes')

#Le gestionnaire peut tout faire, mais seul le superUtilisateur peut creer des utilisateurs.
class IsSuperUserOrGestionnaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_superuser or hasattr(request.user, 'gestionnaire')