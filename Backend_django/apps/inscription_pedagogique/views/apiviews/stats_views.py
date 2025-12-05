# apps/inscription_pedagogique/views/apiviews/stats_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.inscription_pedagogique.models import AnneeAcademique, Inscription, Parcours, Filiere, AnneeEtude
from django.db.models import Count
import logging
from rest_framework.decorators import api_view, permission_classes

logger = logging.getLogger(__name__)


class StatistiquesInscriptionsAPIView(APIView):
    """Stats des inscriptions actuelles"""
    # permission_classes = [IsAuthenticated]  
    
    def get(self, request):
        # Récupérer les filtres 
        annee_academique = request.query_params.get('annee_academique') or request.query_params.get('anneeAcademique')
        parcours = request.query_params.get('parcours')
        filiere = request.query_params.get('filiere')
        annee_etude = request.query_params.get('annee_etude')
        sexe = request.query_params.get('sexe')
        
        # Récupération des inscriptions avec jointures optimisées
        queryset = Inscription.objects.select_related(
            'etudiant',
            'etudiant__utilisateur', 
            'parcours',
            'filiere',
            'annee_etude',
            'anneeAcademique'
        )
        
        # Filtrage par année académique (accepte ID ou libellé)
        if annee_academique and str(annee_academique).strip().lower() not in ['', 'tout']:
            valeur = str(annee_academique).strip()
            
            if valeur.isdigit():
                queryset = queryset.filter(anneeAcademique__id=int(valeur))
            else:
                queryset = queryset.filter(anneeAcademique__libelle__iexact=valeur)
        
        # Filtrage par parcours
        if parcours and str(parcours).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(parcours__id=parcours)
        
        # Filtrage par filière
        if filiere and str(filiere).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(filiere__id=filiere)
        
        # Filtrage par année d'étude
        if annee_etude and str(annee_etude).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(annee_etude__id=annee_etude)
        
        # Filtrage par sexe
        if sexe and str(sexe).strip().lower() not in ['', 'tout']:
            queryset = queryset.filter(etudiant__utilisateur__sexe=sexe)  
        
        
        # Nombre total d'étudiants inscrits
        total_etudiants = queryset.values('etudiant').distinct().count()
        
        # Statistiques par parcours
        stats_parcours = queryset.values(
            'parcours__id',
            'parcours__libelle'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('parcours__libelle')
        
        # Statistiques par filière
        stats_filiere = queryset.values(
            'filiere__id',
            'filiere__nom'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('filiere__nom')
        
        # Statistiques par sexe 
        stats_sexe = queryset.values(
            'etudiant__utilisateur__sexe'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('etudiant__utilisateur__sexe')
        
        # Statistiques par année d'étude 
        stats_annee_etude = queryset.values(
            'annee_etude__id',
            'annee_etude__libelle'
        ).annotate(
            nombre_etudiants=Count('etudiant', distinct=True)
        ).order_by('annee_etude__libelle')  
                
        # Réponse 
        return Response({
            'total_etudiants': total_etudiants,
            'par_parcours': [
                {
                    'id': item['parcours__id'],
                    'libelle': item['parcours__libelle'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_parcours
            ],
            'par_filiere': [
                {
                    'id': item['filiere__id'],
                    'nom': item['filiere__nom'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_filiere
            ],
            'par_sexe': [
                {
                    'sexe': item['etudiant__utilisateur__sexe'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_sexe if item['etudiant__utilisateur__sexe']
            ],
            'par_annee_etude': [
                {
                    'id': item['annee_etude__id'],
                    'libelle': item['annee_etude__libelle'],
                    'nombre_etudiants': item['nombre_etudiants']
                }
                for item in stats_annee_etude if item['annee_etude__id']
            ]
        })


class StatistiquesAbandonsAPIView(APIView):
    """
    Statistiques d'abandon par comparaison entre années N-1 et N
    Exclut les étudiants de L1
    """
    # permission_classes = [IsAuthenticated]  # Décommenter après les tests
    
    def get(self, request):
        """Calcul du taux d'abandon par comparaison N-1 vs N"""
        
        try:
            # Récupérer l'année cible depuis les paramètres ou prendre la plus récente
            annee_param = request.query_params.get('annee_academique')
            
            if annee_param:
                # Chercher par libellé ou par ID
                if annee_param.isdigit():
                    annee_cible = AnneeAcademique.objects.filter(id=int(annee_param)).first()
                else:
                    annee_cible = AnneeAcademique.objects.filter(libelle__iexact=annee_param).first()
                
                if not annee_cible:
                    return Response({"error": f"Année académique '{annee_param}' introuvable"}, status=404)
            else:
                # Prendre l'année la plus récente par défaut
                annee_cible = AnneeAcademique.objects.order_by('-libelle').first()
            
            if not annee_cible:
                return Response({"error": "Aucune année académique trouvée"}, status=400)

            # Année précédente (N-1)
            annee_precedente = AnneeAcademique.objects.exclude(id=annee_cible.id) \
                .order_by('-libelle').first()
            if not annee_precedente:
                return Response({"error": "Pas d'année précédente trouvée"}, status=400)

            logger.info(f"📊 Calcul abandon : {annee_precedente.libelle} → {annee_cible.libelle}")

            # Étudiants inscrits en N-1 (sauf L1)
            inscrits_n1 = Inscription.objects.filter(
                anneeAcademique=annee_precedente
            ).exclude(annee_etude__libelle="Licence 1")

            etudiants_n1 = inscrits_n1.values_list('etudiant_id', flat=True).distinct()
            total_n1 = etudiants_n1.count()

            if total_n1 == 0:
                return Response({
                    "error": "Aucun étudiant en ≥ L2 l'année précédente",
                    "global": {
                        "annee_cible": annee_cible.libelle,
                        "annee_precedente": annee_precedente.libelle,
                        "total_n1": 0,
                        "reinscrits": 0,
                        "abandons": 0,
                        "taux_abandon_pourcent": 0
                    },
                    "par_parcours": [],
                    "par_filiere": [],
                    "par_annee_etude": []
                }, status=200)

            # Réinscrits en N
            reinscrits = Inscription.objects.filter(
                anneeAcademique=annee_cible,
                etudiant_id__in=etudiants_n1
            ).values_list('etudiant_id', flat=True).distinct().count()

            abandons = total_n1 - reinscrits
            taux_global = round((abandons / total_n1) * 100, 2) if total_n1 > 0 else 0

            logger.info(f"✅ Total N-1: {total_n1}, Réinscrits: {reinscrits}, Abandons: {abandons}")

            # === Détail par parcours ===
            par_parcours = []
            for parcours in Parcours.objects.all():
                n1 = inscrits_n1.filter(parcours=parcours).values_list('etudiant_id', flat=True).distinct().count()
                if n1 == 0:
                    continue
                r = Inscription.objects.filter(
                    anneeAcademique=annee_cible,
                    etudiant_id__in=etudiants_n1,
                    parcours=parcours
                ).values_list('etudiant_id', flat=True).distinct().count()
                taux = round(((n1 - r) / n1) * 100, 2) if n1 > 0 else 0
                par_parcours.append({
                    "id": parcours.id,
                    "libelle": parcours.libelle,
                    "total_n1": n1,
                    "abandons": n1 - r,
                    "taux_abandon_pourcent": taux
                })

            # === Détail par filière ===
            par_filiere = []
            for filiere in Filiere.objects.all():
                n1 = inscrits_n1.filter(filiere=filiere).values_list('etudiant_id', flat=True).distinct().count()
                if n1 == 0:
                    continue
                r = Inscription.objects.filter(
                    anneeAcademique=annee_cible,
                    etudiant_id__in=etudiants_n1,
                    filiere=filiere
                ).values_list('etudiant_id', flat=True).distinct().count()
                taux = round(((n1 - r) / n1) * 100, 2) if n1 > 0 else 0
                par_filiere.append({
                    "id": filiere.id,
                    "nom": filiere.nom,
                    "total_n1": n1,
                    "abandons": n1 - r,
                    "taux_abandon_pourcent": taux
                })

            # === Détail par année d'étude (sauf L1) ===
            par_annee_etude = []
            for ae in AnneeEtude.objects.exclude(libelle="Licence 1"):
                n1 = inscrits_n1.filter(annee_etude=ae).values_list('etudiant_id', flat=True).distinct().count()
                if n1 == 0:
                    continue
                r = Inscription.objects.filter(
                    anneeAcademique=annee_cible,
                    etudiant_id__in=etudiants_n1,
                    annee_etude=ae
                ).values_list('etudiant_id', flat=True).distinct().count()
                taux = round(((n1 - r) / n1) * 100, 2) if n1 > 0 else 0
                par_annee_etude.append({
                    "id": ae.id,
                    "libelle": ae.libelle,
                    "total_n1": n1,
                    "abandons": n1 - r,
                    "taux_abandon_pourcent": taux
                })

            return Response({
                "global": {
                    "annee_cible": annee_cible.libelle,
                    "annee_precedente": annee_precedente.libelle,
                    "total_n1": total_n1,
                    "reinscrits": reinscrits,
                    "abandons": abandons,
                    "taux_abandon_pourcent": taux_global
                },
                "par_parcours": par_parcours,
                "par_filiere": par_filiere,
                "par_annee_etude": par_annee_etude
            })
        
        except Exception as e:
            logger.error(f"❌ Erreur stats abandons: {str(e)}")
            return Response({
                "error": f"Erreur lors du calcul: {str(e)}"
            }, status=500)


# Garder l'ancienne fonction pour compatibilité
@api_view(['GET'])
def statistiques_abandon_detail(request):
    """
    Ancienne version fonction - Redirige vers la classe
    """
    view = StatistiquesAbandonsAPIView.as_view()
    return view(request)