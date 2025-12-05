# apps/inscription_pedagogique/views/apiviews/stats_evolution_views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.inscription_pedagogique.models import Inscription, AnneeAcademique, Filiere, Parcours
from django.db.models import Count, Q
import logging

logger = logging.getLogger(__name__)

class StatistiquesEvolutionAPIView(APIView):
    """
    Statistiques d'évolution des inscriptions sur plusieurs années
    avec prévisions simples
    """
    # permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Filtres optionnels
            parcours_id = request.query_params.get('parcours')
            filiere_id = request.query_params.get('filiere')
            
            logger.info(f" Chargement stats évolution - parcours={parcours_id}, filiere={filiere_id}")
            
            # Base queryset
            queryset = Inscription.objects.select_related(
                'anneeAcademique',
                'parcours',
                'filiere'
            )
            
            # Filtrage
            if parcours_id:
                queryset = queryset.filter(parcours_id=parcours_id)
            if filiere_id:
                queryset = queryset.filter(filiere_id=filiere_id)
            
            # ═══════════════════════════════════════════════════════
            # 1. ÉVOLUTION PAR ANNÉE ACADÉMIQUE
            # ═══════════════════════════════════════════════════════
            stats_par_annee = queryset.values(
                'anneeAcademique__id',
                'anneeAcademique__libelle'
            ).annotate(
                total_inscrits=Count('etudiant', distinct=True)
            ).order_by('anneeAcademique__libelle')
            
            evolution_annuelle = []
            annees_list = list(stats_par_annee)
            
            for i, annee in enumerate(annees_list):
                # Calculer la croissance par rapport à l'année précédente
                croissance = 0
                croissance_pct = 0
                
                if i > 0:
                    annee_precedente = annees_list[i - 1]['total_inscrits']
                    annee_actuelle = annee['total_inscrits']
                    
                    if annee_precedente > 0:
                        croissance = annee_actuelle - annee_precedente
                        croissance_pct = (croissance / annee_precedente) * 100
                
                evolution_annuelle.append({
                    'annee_id': annee['anneeAcademique__id'],
                    'annee': annee['anneeAcademique__libelle'],
                    'total_inscrits': annee['total_inscrits'],
                    'croissance': croissance,
                    'croissance_pct': round(croissance_pct, 1)
                })
            
            # ═══════════════════════════════════════════════════════
            # 2. TAUX DE CROISSANCE MOYEN
            # ═══════════════════════════════════════════════════════
            taux_croissance_liste = [
                item['croissance_pct'] 
                for item in evolution_annuelle 
                if item['croissance_pct'] != 0
            ]
            
            taux_croissance_moyen = (
                sum(taux_croissance_liste) / len(taux_croissance_liste)
                if taux_croissance_liste else 0
            )
            
            # ═══════════════════════════════════════════════════════
            # 3. PRÉVISIONS SIMPLES (Année suivante)
            # ═══════════════════════════════════════════════════════
            previsions = []
            
            if evolution_annuelle:
                derniere_annee = evolution_annuelle[-1]
                inscrits_actuels = derniere_annee['total_inscrits']
                
                # Scénario PESSIMISTE (-5% ou moitié de la croissance moyenne)
                taux_pessimiste = min(taux_croissance_moyen / 2, -5) if taux_croissance_moyen < 0 else max(taux_croissance_moyen * 0.5, 0)
                prevision_pessimiste = int(inscrits_actuels * (1 + taux_pessimiste / 100))
                
                # Scénario RÉALISTE (croissance moyenne)
                prevision_realiste = int(inscrits_actuels * (1 + taux_croissance_moyen / 100))
                
                # Scénario OPTIMISTE (+15% ou 1.5x la croissance moyenne)
                taux_optimiste = max(taux_croissance_moyen * 1.5, 15) if taux_croissance_moyen > 0 else taux_croissance_moyen
                prevision_optimiste = int(inscrits_actuels * (1 + taux_optimiste / 100))
                
                previsions = [
                    {
                        'scenario': 'Pessimiste',
                        'taux': round(taux_pessimiste, 1),
                        'prevision': prevision_pessimiste
                    },
                    {
                        'scenario': 'Réaliste',
                        'taux': round(taux_croissance_moyen, 1),
                        'prevision': prevision_realiste
                    },
                    {
                        'scenario': 'Optimiste',
                        'taux': round(taux_optimiste, 1),
                        'prevision': prevision_optimiste
                    }
                ]
            
            # ═══════════════════════════════════════════════════════
            # 4. ÉVOLUTION PAR FILIÈRE (3 dernières années)
            # ═══════════════════════════════════════════════════════
            # Prendre les 3 dernières années académiques
            dernieres_annees = list(AnneeAcademique.objects.order_by('-libelle')[:3].values_list('id', flat=True))
            
            stats_filieres = queryset.filter(
                anneeAcademique_id__in=dernieres_annees
            ).values(
                'filiere__id',
                'filiere__nom',
                'anneeAcademique__libelle'
            ).annotate(
                total=Count('etudiant', distinct=True)
            ).order_by('filiere__nom', 'anneeAcademique__libelle')
            
            # Grouper par filière
            evolution_par_filiere = {}
            for stat in stats_filieres:
                filiere_nom = stat['filiere__nom']
                if filiere_nom not in evolution_par_filiere:
                    evolution_par_filiere[filiere_nom] = {
                        'filiere_id': stat['filiere__id'],
                        'filiere': filiere_nom,
                        'annees': []
                    }
                evolution_par_filiere[filiere_nom]['annees'].append({
                    'annee': stat['anneeAcademique__libelle'],
                    'total': stat['total']
                })
            
            # ═══════════════════════════════════════════════════════
            # 5. ÉVOLUTION PAR PARCOURS (3 dernières années)
            # ═══════════════════════════════════════════════════════
            stats_parcours = queryset.filter(
                anneeAcademique_id__in=dernieres_annees
            ).values(
                'parcours__id',
                'parcours__libelle',
                'anneeAcademique__libelle'
            ).annotate(
                total=Count('etudiant', distinct=True)
            ).order_by('parcours__libelle', 'anneeAcademique__libelle')
            
            # Grouper par parcours
            evolution_par_parcours = {}
            for stat in stats_parcours:
                parcours_nom = stat['parcours__libelle']
                if parcours_nom not in evolution_par_parcours:
                    evolution_par_parcours[parcours_nom] = {
                        'parcours_id': stat['parcours__id'],
                        'parcours': parcours_nom,
                        'annees': []
                    }
                evolution_par_parcours[parcours_nom]['annees'].append({
                    'annee': stat['anneeAcademique__libelle'],
                    'total': stat['total']
                })
            
            # ═══════════════════════════════════════════════════════
            # RÉPONSE FINALE
            # ═══════════════════════════════════════════════════════
            response_data = {
                'evolution_annuelle': evolution_annuelle,
                'taux_croissance_moyen': round(taux_croissance_moyen, 1),
                'previsions': previsions,
                'evolution_par_filiere': list(evolution_par_filiere.values()),
                'evolution_par_parcours': list(evolution_par_parcours.values()),
                'nombre_annees': len(evolution_annuelle)
            }
            
            logger.info(f" Stats évolution calculées - {len(evolution_annuelle)} années")
            return Response(response_data)
            
        except Exception as e:
            logger.error(f" Erreur stats évolution: {str(e)}")
            return Response(
                {'error': 'Erreur lors du calcul des statistiques'},
                status=500
            )