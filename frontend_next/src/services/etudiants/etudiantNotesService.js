// frontend_next/src/services/etudiants/etudiantNotesService.js
import { authAPI } from "@/services/authService";
import api from "@/services/api";

const etudiantNotesService = {
  // Récupérer les données complètes de l'étudiant connecté
  getMyCompleteData: async () => {
    try {
      const response = await authAPI.apiInstance().get("/utilisateurs/etudiants/me/");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération données étudiant:", error);
      throw error;
    }
  },

  // Récupérer les UEs avec toutes les informations détaillées (notes, semestre, validation)
  getMyUEsWithNotes: async () => {
    try {
      // 1. Récupérer les données de l'étudiant
      const etudiantData = await etudiantNotesService.getMyCompleteData();
      const etudiantId = etudiantData.id;

      // 2. Récupérer ses inscriptions avec toutes les relations
      const inscriptionsResponse = await api.get("/inscription/inscription/", {
        params: { etudiant: etudiantId },
      });
      const inscriptions = inscriptionsResponse.data.results || inscriptionsResponse.data;

      if (!inscriptions || inscriptions.length === 0) {
        throw new Error("Aucune inscription trouvée pour cet étudiant");
      }

      // 3. Pour chaque inscription, récupérer les UEs avec leurs détails complets
      const uesWithCompleteData = [];
      
      for (const inscription of inscriptions) {
        if (inscription.ues && inscription.ues.length > 0) {
          for (const ueId of inscription.ues) {
            try {
              // Récupérer les détails complets de l'UE
              const ueResponse = await api.get(`/notes/ues/${ueId}/`);
              const ue = ueResponse.data;

              // Récupérer les informations du semestre depuis l'année d'étude
              const anneeEtudeResponse = await api.get(`/inscription/annee-etude/${inscription.annee_etude}/`);
              const anneeEtudeData = anneeEtudeResponse.data;
              
              // Récupérer les semestres liés à cette année d'étude
              let semestreInfo = "Non spécifié";
              if (anneeEtudeData.semestre && anneeEtudeData.semestre.length > 0) {
                // Prendre le premier semestre (ou vous pouvez ajuster selon votre logique)
                const semestreResponse = await api.get(`/inscription/semestre/${anneeEtudeData.semestre[0]}/`);
                semestreInfo = semestreResponse.data.libelle;
              }

              // Récupérer les notes de cette UE
              let notesData = null;
              let moyenneUE = null;
              let notesParEvaluation = [];
              let statutValidation = "Aucune note";

              try {
                const notesResponse = await api.get(`/notes/ues/${ueId}/notes/`);
                notesData = notesResponse.data;

                // Trouver les notes de cet étudiant
                const etudiantNotes = notesData.etudiants?.find((e) => e.id === etudiantId);

                if (etudiantNotes && notesData.evaluations) {
                  let sommeNotesPonderees = 0;
                  let poidsTotal = 0;
                  let hasNotes = false;

                  notesData.evaluations.forEach((evaluation) => {
                    const noteValue = etudiantNotes.notes[evaluation.id.toString()];
                    notesParEvaluation.push({
                      id: evaluation.id,
                      type: evaluation.type,
                      poids: evaluation.poids,
                      note: noteValue,
                    });

                    if (noteValue !== null && noteValue !== undefined) {
                      sommeNotesPonderees += noteValue * evaluation.poids;
                      poidsTotal += evaluation.poids;
                      hasNotes = true;
                    }
                  });

                  if (poidsTotal > 0 && hasNotes) {
                    moyenneUE = Math.round((sommeNotesPonderees / poidsTotal) * 100) / 100;
                    statutValidation = moyenneUE >= 10 ? "Validé" : "Non Validé";
                  } else {
                    statutValidation = "En cours";
                  }
                }
              } catch (notesError) {
                console.warn(`Pas de notes pour l'UE ${ueId}:`, notesError);
                statutValidation = "Aucune note";
              }

              // Calculer les crédits validés
              const creditTotal = parseInt(ue.nbre_credit) || 0;
              const creditValide = (moyenneUE !== null && moyenneUE >= 10) ? creditTotal : 0;

              uesWithCompleteData.push({
                id: ue.id,
                code: ue.code,
                libelle: ue.libelle,
                credits: creditTotal,
                creditValide: creditValide,
                composite: ue.composite,
                description: ue.description || "",
                semestre: semestreInfo,
                notes: notesParEvaluation,
                moyenne: moyenneUE,
                statut: statutValidation,
                // Informations additionnelles
                parcours: inscription.parcours,
                filiere: inscription.filiere,
                annee_etude: inscription.annee_etude,
                annee_academique: inscription.anneeAcademique
              });

            } catch (ueError) {
              console.error(`Erreur récupération UE ${ueId}:`, ueError);
              // Ajouter l'UE même avec des données partielles
              try {
                const ueResponse = await api.get(`/notes/ues/${ueId}/`);
                const ue = ueResponse.data;
                uesWithCompleteData.push({
                  id: ue.id,
                  code: ue.code,
                  libelle: ue.libelle,
                  credits: parseInt(ue.nbre_credit) || 0,
                  creditValide: 0,
                  composite: ue.composite,
                  description: ue.description || "",
                  semestre: "Non spécifié",
                  notes: [],
                  moyenne: null,
                  statut: "Erreur de chargement",
                });
              } catch (fallbackError) {
                console.error(`Impossible de récupérer l'UE ${ueId}:`, fallbackError);
              }
            }
          }
        }
      }

      return uesWithCompleteData;
    } catch (error) {
      console.error("Erreur récupération UEs avec notes complètes:", error);
      throw error;
    }
  },

  // Récupérer seulement les UEs sans les notes (fallback)
  getMyUEsOnly: async () => {
    try {
      const etudiantData = await etudiantNotesService.getMyCompleteData();
      const etudiantId = etudiantData.id;

      const inscriptionsResponse = await api.get("/inscription/inscription/", {
        params: { etudiant: etudiantId },
      });
      const inscriptions = inscriptionsResponse.data.results || inscriptionsResponse.data;

      if (!inscriptions || inscriptions.length === 0) {
        return [];
      }

      const uesData = [];
      
      for (const inscription of inscriptions) {
        if (inscription.ues && inscription.ues.length > 0) {
          for (const ueId of inscription.ues) {
            try {
              const ueResponse = await api.get(`/notes/ues/${ueId}/`);
              const ue = ueResponse.data;
              
              uesData.push({
                id: ue.id,
                code: ue.code,
                libelle: ue.libelle,
                credits: parseInt(ue.nbre_credit) || 0,
                creditValide: 0,
                composite: ue.composite,
                description: ue.description || "",
                semestre: "Non spécifié",
                notes: [],
                moyenne: null,
                statut: "Notes non disponibles",
              });
            } catch (ueError) {
              console.error(`Erreur récupération UE ${ueId}:`, ueError);
            }
          }
        }
      }

      return uesData;
    } catch (error) {
      console.error("Erreur récupération UEs seulement:", error);
      throw error;
    }
  },

  // Calculer les statistiques complètes
  calculateMyStats: async () => {
    try {
      const uesWithNotes = await etudiantNotesService.getMyUEsWithNotes();

      let totalCredits = 0;
      let creditsObtenus = 0;
      let totalNotes = 0;
      let nombreNotesValides = 0;
      let uesValidees = 0;
      let uesEnCours = 0;
      let uesNonValidees = 0;

      // Statistiques par semestre
      const statsBySemestre = {};

      uesWithNotes.forEach((ue) => {
        totalCredits += ue.credits;
        
        // Stats par semestre
        if (!statsBySemestre[ue.semestre]) {
          statsBySemestre[ue.semestre] = {
            totalCredits: 0,
            creditsObtenus: 0,
            uesValidees: 0,
            uesTotal: 0,
            moyenneGenerale: 0,
            totalNotes: 0,
            nombreNotesValides: 0
          };
        }
        
        statsBySemestre[ue.semestre].totalCredits += ue.credits;
        statsBySemestre[ue.semestre].uesTotal += 1;

        if (ue.moyenne !== null) {
          totalNotes += ue.moyenne;
          nombreNotesValides++;
          statsBySemestre[ue.semestre].totalNotes += ue.moyenne;
          statsBySemestre[ue.semestre].nombreNotesValides += 1;
          
          if (ue.moyenne >= 10) {
            uesValidees++;
            creditsObtenus += ue.credits;
            statsBySemestre[ue.semestre].uesValidees += 1;
            statsBySemestre[ue.semestre].creditsObtenus += ue.credits;
          } else {
            uesNonValidees++;
          }
        } else {
          if (ue.statut === "En cours") {
            uesEnCours++;
          }
        }
      });

      // Calculer la moyenne pour chaque semestre
      Object.keys(statsBySemestre).forEach(semestre => {
        const stats = statsBySemestre[semestre];
        if (stats.nombreNotesValides > 0) {
          stats.moyenneGenerale = Math.round((stats.totalNotes / stats.nombreNotesValides) * 100) / 100;
        }
        stats.progressionPourcentage = stats.totalCredits > 0 ? Math.round((stats.creditsObtenus / stats.totalCredits) * 100) : 0;
      });

      const moyenneGenerale = nombreNotesValides > 0 ? Math.round((totalNotes / nombreNotesValides) * 100) / 100 : 0;
      const progressionPourcentage = totalCredits > 0 ? Math.round((creditsObtenus / totalCredits) * 100) : 0;

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
          nombreUEsAvecNotes: uesWithNotes.filter((ue) => ue.moyenne !== null).length,
          rang: null, // À implémenter plus tard
        },
        parSemestre: statsBySemestre
      };
    } catch (error) {
      console.error("Erreur calcul statistiques:", error);
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

  // Récupérer le détail d'une UE spécifique avec ses notes
  getUEDetails: async (ueId) => {
    try {
      const etudiantData = await etudiantNotesService.getMyCompleteData();
      const etudiantId = etudiantData.id;

      // Récupérer les détails de l'UE
      const ueResponse = await api.get(`/notes/ues/${ueId}/`);
      const ue = ueResponse.data;

      // Récupérer les notes détaillées
      const notesResponse = await api.get(`/notes/ues/${ueId}/notes/`);
      const notesData = notesResponse.data;

      // Trouver les notes de l'étudiant
      const etudiantNotes = notesData.etudiants?.find((e) => e.id === etudiantId);

      let evaluationsDetails = [];
      let moyenneUE = null;

      if (etudiantNotes && notesData.evaluations) {
        let sommeNotesPonderees = 0;
        let poidsTotal = 0;

        evaluationsDetails = notesData.evaluations.map((evaluation) => {
          const noteValue = etudiantNotes.notes[evaluation.id.toString()];
          
          if (noteValue !== null && noteValue !== undefined) {
            sommeNotesPonderees += noteValue * evaluation.poids;
            poidsTotal += evaluation.poids;
          }

          return {
            id: evaluation.id,
            type: evaluation.type,
            poids: evaluation.poids,
            note: noteValue,
            coefficient: evaluation.poids,
            dateEvaluation: evaluation.date || null,
            commentaire: evaluation.commentaire || null
          };
        });

        if (poidsTotal > 0) {
          moyenneUE = Math.round((sommeNotesPonderees / poidsTotal) * 100) / 100;
        }
      }

      return {
        ue: {
          id: ue.id,
          code: ue.code,
          libelle: ue.libelle,
          description: ue.description,
          credits: parseInt(ue.nbre_credit) || 0,
          composite: ue.composite,
        },
        evaluations: evaluationsDetails,
        moyenne: moyenneUE,
        statut: moyenneUE !== null ? (moyenneUE >= 10 ? "Validé" : "Non Validé") : "En cours",
        creditValide: (moyenneUE !== null && moyenneUE >= 10) ? parseInt(ue.nbre_credit) || 0 : 0
      };
    } catch (error) {
      console.error(`Erreur récupération détails UE ${ueId}:`, error);
      throw error;
    }
  }
};

export default etudiantNotesService;