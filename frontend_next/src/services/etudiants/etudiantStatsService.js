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

      // Traiter les données pour s'assurer qu'elles sont complètes
      const data = response.data;

      const processedData = {
        ...data,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        telephone: data.telephone || '',
        sexe: data.sexe || '',
        autre_prenom: data.autre_prenom || '',
        num_carte: data.num_carte || '',
        lieu_naiss: data.lieu_naiss || '',
        parcours_info: data.parcours_info || 'Non spécifié',
        filiere_info: data.filiere_info || 'Non spécifié',
        annee_etude_info: data.annee_etude_info || 'Non spécifié',
        photo: data.photo || null,
        is_validated: data.is_validated || false,
        date_naiss: data.date_naiss || null
      };

      return processedData;
    } catch (error) {
      console.error("Erreur récupération données étudiant:", error);
      throw error;
    }
  },


  /**
   * Calcule les statistiques complètes de l'étudiant
   */
  calculateMyStats: async () => {
    try {
      const uesWithNotes = await etudiantNotesService.getMyUEsWithNotes();

      let totalCredits = 0;
      let creditsObtenus = 0;
      let weightedSum = 0; // Somme des (note × crédits)
      let uesValidees = 0;
      let uesNonValidees = 0;
      let uesEnCours = 0;
      let totalMoyennes = 0;
      let nombreUEsAvecMoyenne = 0;

      // Statistiques par semestre
      const statsBySemestre = {};

      uesWithNotes.forEach((ue) => {
        const semestre = ue.semestre || "Non spécifié";

        // Initialiser les stats par semestre si nécessaire
        if (!statsBySemestre[semestre]) {
          statsBySemestre[semestre] = {
            totalCredits: 0,
            creditsObtenus: 0,
            uesValidees: 0,
            uesNonValidees: 0,
            uesEnCours: 0,
            uesTotal: 0,
            moyenneGenerale: 0,
            totalMoyennes: 0,
            nombreUEsAvecMoyenne: 0
          };
        }

        // Statistiques globales
        totalCredits += ue.credits;
        statsBySemestre[semestre].totalCredits += ue.credits;
        statsBySemestre[semestre].uesTotal += 1;

        // Traitement selon le statut de l'UE
        if (ue.moyenne !== null && ue.moyenne !== undefined) {
          // UE avec moyenne calculée
          weightedSum += ue.moyenne * ue.credits;
          totalMoyennes += ue.moyenne;
          nombreUEsAvecMoyenne++;

          statsBySemestre[semestre].totalMoyennes += ue.moyenne;
          statsBySemestre[semestre].nombreUEsAvecMoyenne += 1;

          if (ue.moyenne >= 10) {
            uesValidees++;
            creditsObtenus += ue.credits;
            statsBySemestre[semestre].uesValidees += 1;
            statsBySemestre[semestre].creditsObtenus += ue.credits;
          } else {
            uesNonValidees++;
            statsBySemestre[semestre].uesNonValidees += 1;
          }
        } else {
          // UE en cours (pas encore de notes)
          uesEnCours++;
          statsBySemestre[semestre].uesEnCours += 1;
        }
      });

      // Calcul des moyennes par semestre
      Object.keys(statsBySemestre).forEach(semestre => {
        const stats = statsBySemestre[semestre];
        if (stats.nombreUEsAvecMoyenne > 0) {
          stats.moyenneGenerale = Math.round((stats.totalMoyennes / stats.nombreUEsAvecMoyenne) * 100) / 100;
        }
        stats.progressionPourcentage = stats.totalCredits > 0 
          ? Math.round((stats.creditsObtenus / stats.totalCredits) * 100) 
          : 0;
      });

      // Calcul des statistiques globales
      const moyenneGenerale = totalCredits > 0 
        ? Math.round((weightedSum / totalCredits) * 100) / 100 
        : 0;

      const progressionPourcentage = totalCredits > 0 
        ? Math.round((creditsObtenus / totalCredits) * 100) 
        : 0;

      return {
        global: {
          uesValidees,
          uesNonValidees,
          uesEnCours,
          creditsObtenus,
          totalCredits,
          moyenneGenerale,
          progressionPourcentage,
          nombreUEsInscrites: uesWithNotes.length,
          nombreUEsAvecNotes: nombreUEsAvecMoyenne,
          rang: null,
        },
        parSemestre: statsBySemestre
      };

    } catch (error) {
      console.error("Erreur calcul statistiques:", error);
      // Retourner des statistiques par défaut en cas d'erreur
      return {
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
          rang: null,
        },
        parSemestre: {}
      };
    }
  },


  /**
   * Récupère les résultats calculés (via ResultatUE)
   */
  getMyResults: async () => {
    try {
      const etudiantData = await etudiantStatsService.getMyCompleteData();
      const etudiantId = etudiantData.id;
      const resultsResponse = await api.get(`/page_professeur/resultats/par-etudiant/${etudiantId}/`);
      return resultsResponse.data;
    } catch (error) {
      console.error("Erreur récupération résultats:", error);
      throw error;
    }
  },


  /**
   * Calcule la progression par semestre
   */
  getProgressionBySemestre: async () => {
    try {
      const stats = await etudiantStatsService.calculateMyStats();
      const progression = [];
      Object.keys(stats.parSemestre).forEach(semestre => {
        const semestreStats = stats.parSemestre[semestre];
        progression.push({
          semestre,
          creditsObtenus: semestreStats.creditsObtenus,
          totalCredits: semestreStats.totalCredits,
          progression: semestreStats.progressionPourcentage,
          uesValidees: semestreStats.uesValidees,
          uesTotal: semestreStats.uesTotal,
          moyenne: semestreStats.moyenneGenerale
        });
      });
      return progression;
    } catch (error) {
      console.error("Erreur calcul progression par semestre:", error);
      return [];
    }
  },


  /**
   * Génère un rapport de performance
   */
  generatePerformanceReport: async () => {
    try {
      const stats = await etudiantStatsService.calculateMyStats();
      const progression = await etudiantStatsService.getProgressionBySemestre();
      const uesWithNotes = await etudiantNotesService.getMyUEsWithNotes();

      // Calculer les UEs en difficulté (moyenne < 8)
      const uesEnDifficulte = uesWithNotes.filter(ue =>  
        ue.moyenne !== null && ue.moyenne < 8
      ).length;

      // Calculer les UEs excellentes (moyenne >= 14)
      const uesExcellent = uesWithNotes.filter(ue =>  
        ue.moyenne !== null && ue.moyenne >= 14
      ).length;

      return {
        resume: {
          moyenneGenerale: stats.global.moyenneGenerale,
          progressionGlobale: stats.global.progressionPourcentage,
          creditsObtenus: stats.global.creditsObtenus,
          totalCredits: stats.global.totalCredits,
          uesValidees: stats.global.uesValidees,
          uesTotal: stats.global.nombreUEsInscrites
        },
        performance: {
          uesEnDifficulte,
          uesExcellent,
          tauxReussite: stats.global.nombreUEsInscrites > 0 
            ? Math.round((stats.global.uesValidees / stats.global.nombreUEsInscrites) * 100) 
            : 0
        },
        progressionParSemestre: progression,
        dernierSemestre: progression.length > 0 ? progression[progression.length - 1] : null
      };

    } catch (error) {
      console.error("Erreur génération rapport performance:", error);
      return null;
    }
  },


  /**
   * Récupère un résumé rapide des performances
   */
  getQuickSummary: async () => {
    try {
      const stats = await etudiantStatsService.calculateMyStats();
      const uesCount = stats.global.nombreUEsInscrites;
      return {
        uesInscrites: uesCount,
        uesValidees: stats.global.uesValidees,
        moyenneGenerale: stats.global.moyenneGenerale,
        creditsObtenus: stats.global.creditsObtenus,
        progression: stats.global.progressionPourcentage
      };
    } catch (error) {
      console.error("Erreur récupération résumé:", error);
      return {
        uesInscrites: 0,
        uesValidees: 0,
        moyenneGenerale: 0,
        creditsObtenus: 0,
        progression: 0
      };
    }
  }

};

export default etudiantStatsService;