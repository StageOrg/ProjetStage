// frontend_next/src/services/etudiants/etudiantStatsService.js

import { authAPI } from "@/services/authService";
import api from "@/services/api";
import etudiantNotesService from "./etudiantNotesService";

const etudiantStatsService = {

  /**
   * Récupère les données complètes de l'étudiant connecté
   */
  getMyCompleteData: async () => {
    try {
      const response = await authAPI.apiInstance().get("/utilisateurs/etudiants/me/");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération données étudiant:", error);
      throw error;
    }
  },

  /**
   * Calcule la moyenne d'une UE à partir des notes individuelles
   */
  calculateUEMoyenne: (ue) => {
    // Si l'UE a déjà une moyenne calculée par le backend, l'utiliser
    if (ue.moyenne !== null && ue.moyenne !== undefined) {
      return ue.moyenne;
    }

    // Sinon, calculer à partir des notes individuelles
    if (!ue.notes || !Array.isArray(ue.notes) || ue.notes.length === 0) {
      return null;
    }

    let sommeNotesPonderees = 0;
    let poidsTotal = 0;
    let hasValidNotes = false;

    ue.notes.forEach(evaluation => {
      const note = evaluation.note;
      const poids = evaluation.poids || 1;

      if (note !== null && note !== undefined && !isNaN(note)) {
        sommeNotesPonderees += note * poids;
        poidsTotal += poids;
        hasValidNotes = true;
      }
    });

    if (poidsTotal > 0 && hasValidNotes) {
      return Math.round((sommeNotesPonderees / poidsTotal) * 100) / 100;
    }

    return null;
  },

  /**
   * Détermine le statut d'une UE basé sur la moyenne calculée
   */
  determineUEStatut: (moyenne, credits) => {
    if (moyenne === null || moyenne === undefined) {
      return { statut: "En cours", creditValide: 0 };
    }
    
    if (moyenne >= 10) {
      return { statut: "Validé", creditValide: credits };
    } else {
      return { statut: "Non validé", creditValide: 0 };
    }
  },

  /**
   * Calcule les statistiques complètes de l'étudiant - VERSION SIMPLIFIÉE ET FONCTIONNELLE
   */
  calculateMyStats: async () => {
    try {

      // Récupérer les UEs avec notes
      const uesWithNotes = await etudiantNotesService.getMyUEsWithNotes();

      // Si pas d'UEs, retourner des stats vides
      if (!uesWithNotes || uesWithNotes.length === 0) {
        console.warn("⚠️ Aucune UE trouvée");
        return etudiantStatsService.getEmptyStats();
      }

      let totalCredits = 0;
      let creditsObtenus = 0;
      let uesValidees = 0;
      let uesNonValidees = 0;
      let uesEnCours = 0;
      let sommeMoyennesPonderees = 0;
      let uesAvecMoyenne = 0;

      // Analyser chaque UE
      uesWithNotes.forEach((ue) => {
        const credits = ue.credits || 0;
        const moyenne = ue.moyenne; // Utiliser directement la moyenne du backend

        totalCredits += credits;

        if (moyenne !== null && moyenne !== undefined) {
          // UE avec moyenne
          sommeMoyennesPonderees += moyenne * credits;
          uesAvecMoyenne++;

          if (moyenne >= 10) {
            uesValidees++;
            creditsObtenus += credits;
          } else {
            uesNonValidees++;
          }
        } else {
          // UE sans moyenne
          uesEnCours++;
        }
      });

      // Calculs finaux
      const moyenneGenerale = totalCredits > 0 
        ? Math.round((sommeMoyennesPonderees / totalCredits) * 100) / 100 
        : 0;

      const progressionPourcentage = totalCredits > 0 
        ? Math.round((creditsObtenus / totalCredits) * 100) 
        : 0;

      const result = {
        global: {
          uesValidees,
          uesNonValidees,
          uesEnCours,
          creditsObtenus,
          totalCredits,
          moyenneGenerale,
          progressionPourcentage,
          nombreUEsInscrites: uesWithNotes.length,
          nombreUEsAvecNotes: uesAvecMoyenne,
          tauxReussite: uesWithNotes.length > 0 
            ? Math.round((uesValidees / uesWithNotes.length) * 100) 
            : 0
        },
        uesDetails: uesWithNotes,
        lastUpdated: new Date().toISOString()
      };

      return result;

    } catch (error) {
      console.error("❌ Erreur calcul statistiques:", error);
      return etudiantStatsService.getEmptyStats();
    }
  },

  /**
   * Analyse détaillée des performances - VERSION COMPLÈTE
   */
  analyzePerformance: (uesWithNotes) => {
    const analysis = {
      uesEnDifficulte: 0,      // moyenne < 8
      uesSatisfaisantes: 0,    // 8 <= moyenne < 12
      uesBonnes: 0,            // 12 <= moyenne < 14
      uesExcellent: 0,         // moyenne >= 14
      meilleureUE: null,
      pireUE: null,
      distributionNotes: {
        '0-4': 0, '5-8': 0, '9-12': 0, '13-16': 0, '17-20': 0
      }
    };

    uesWithNotes.forEach(ue => {
      const moyenne = ue.moyenne; // Utiliser directement la moyenne du backend
      
      if (moyenne !== null && moyenne !== undefined) {
        // Distribution des notes
        if (moyenne >= 0 && moyenne < 5) analysis.distributionNotes['0-4']++;
        else if (moyenne >= 5 && moyenne < 9) analysis.distributionNotes['5-8']++;
        else if (moyenne >= 9 && moyenne < 13) analysis.distributionNotes['9-12']++;
        else if (moyenne >= 13 && moyenne < 17) analysis.distributionNotes['13-16']++;
        else if (moyenne >= 17) analysis.distributionNotes['17-20']++;

        // Catégorisation performance
        if (moyenne < 8) analysis.uesEnDifficulte++;
        else if (moyenne < 12) analysis.uesSatisfaisantes++;
        else if (moyenne < 14) analysis.uesBonnes++;
        else analysis.uesExcellent++;

        // Meilleure et pire UE
        if (!analysis.meilleureUE || moyenne > analysis.meilleureUE.moyenne) {
          analysis.meilleureUE = { 
            ue: ue.libelle || ue.code, 
            moyenne: moyenne,
            credits: ue.credits || 0
          };
        }
        if (!analysis.pireUE || moyenne < analysis.pireUE.moyenne) {
          analysis.pireUE = { 
            ue: ue.libelle || ue.code, 
            moyenne: moyenne,
            credits: ue.credits || 0
          };
        }
      }
    });

    return analysis;
  },

  /**
   * Retourne des statistiques vides (fallback)
   */
  getEmptyStats: () => ({
    global: {
      uesValidees: 0,
      uesNonValidees: 0,
      uesEnCours: 0,
      creditsObtenus: 0,
      totalCredits: 0,
      moyenneGenerale: 0,
      progressionPourcentage: 0,
      nombreUEsInscrites: 0,
      nombreUEsAvecNotes: 0,
      tauxReussite: 0
    },
    uesDetails: [],
    lastUpdated: new Date().toISOString()
  }),

  /**
   * Récupère un résumé rapide des performances
   */
  getQuickSummary: async () => {
    try {
      const stats = await etudiantStatsService.calculateMyStats();
      
      return {
        uesInscrites: stats.global.nombreUEsInscrites,
        uesValidees: stats.global.uesValidees,
        moyenneGenerale: stats.global.moyenneGenerale,
        creditsObtenus: stats.global.creditsObtenus,
        progression: stats.global.progressionPourcentage,
        tauxReussite: stats.global.tauxReussite,
        dernierCalcul: stats.lastUpdated
      };
    } catch (error) {
      console.error("Erreur récupération résumé:", error);
      return {
        uesInscrites: 0,
        uesValidees: 0,
        moyenneGenerale: 0,
        creditsObtenus: 0,
        progression: 0,
        tauxReussite: 0,
        dernierCalcul: new Date().toISOString()
      };
    }
  },

  /**
   * TEST DIRECT - Méthode pour vérifier que ça fonctionne
   */
  testService: async () => {
    try {
      
      // 1. Vérifier les données étudiant
      const studentData = await etudiantStatsService.getMyCompleteData();

      // 2. Calculer les stats
      const stats = await etudiantStatsService.calculateMyStats();

      // 3. Résumé rapide
      const summary = await etudiantStatsService.getQuickSummary();

      return {
        success: true,
        studentData,
        stats,
        summary
      };

    } catch (error) {
      console.error("❌ Test échoué:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

};

export default etudiantStatsService;
