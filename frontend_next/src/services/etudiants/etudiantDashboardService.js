// frontend_next/src/services/etudiants/etudiantDashboardService.js
import { authAPI } from "@/services/authService";
import api from "@/services/api";

const etudiantDashboardService = {
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

  // Nouvelle méthode pour mettre à jour les données de l'étudiant
  updateMyData: async (dataToSend) => {
    try {
      console.log('Données envoyées pour mise à jour:', dataToSend);
      
      // Toujours créer un nouveau FormData
      const formData = new FormData();
      
      // Ajouter les champs texte requis
      const requiredFields = ['email', 'first_name', 'last_name'];
      for (const field of requiredFields) {
        const value = dataToSend instanceof FormData ? dataToSend.get(field) : dataToSend[field];
        if (!value) {
          throw new Error(`Le champ ${field} est requis`);
        }
        formData.append(field, value);
      }

      // Ajouter les champs optionnels
      const optionalFields = ['telephone', 'autre_prenom', 'num_carte'];
      for (const field of optionalFields) {
        const value = dataToSend instanceof FormData ? dataToSend.get(field) : dataToSend[field];
        if (value !== undefined && value !== null) {
          formData.append(field, value);
        }
      }

      // Gestion spéciale de la photo
      const photo = dataToSend instanceof FormData ? dataToSend.get('photo') : dataToSend.photo;
      if (photo instanceof File) {
        formData.append('photo', photo);
      } else if (photo && typeof photo === 'string' && !photo.startsWith('/media')) {
        // Si c'est une nouvelle photo (pas une URL existante)
        formData.append('photo', photo);
      }
      
      const response = await authAPI.apiInstance().put("/utilisateurs/etudiants/me/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Réponse de mise à jour:', response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur mise à jour données étudiant:", error);
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
      }
      throw error;
    }
  },

  // Récupérer les UEs avec les notes de l'étudiant
  getMyUEsWithNotes: async () => {
    try {
      // 1. Récupérer les données de l'étudiant
      const etudiantData = await authAPI.apiInstance().get("/utilisateurs/etudiants/me/");
      const etudiantId = etudiantData.data.id;

      // 2. Récupérer ses inscriptions
      const inscriptionsResponse = await api.get("/inscription/inscription/", {
        params: { etudiant: etudiantId },
      });
      const inscriptions = inscriptionsResponse.data.results || inscriptionsResponse.data;

      if (!inscriptions || inscriptions.length === 0) {
        return [];
      }

      // 3. Pour chaque UE inscrite, récupérer les détails et notes
      const uesWithNotes = [];
      const inscription = inscriptions[0]; // Prendre l'inscription active

      if (inscription.ues && inscription.ues.length > 0) {
        for (const ueId of inscription.ues) {
          try {
            // Récupérer les détails de l'UE
            const ueResponse = await api.get(`/notes/ues/${ueId}/`);
            const ue = ueResponse.data;

            // Récupérer les notes de cette UE
            const notesResponse = await api.get(`/notes/ues/${ueId}/notes/`);
            const notesData = notesResponse.data;

            // Trouver les notes de cet étudiant
            const etudiantNotes = notesData.etudiants?.find((e) => e.id === etudiantId);
            const notesParEvaluation = [];
            let moyenneUE = null;

            if (etudiantNotes && notesData.evaluations) {
              let sommeNotesPonderees = 0;
              let poidsTotal = 0;

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
                }
              });

              if (poidsTotal > 0) {
                moyenneUE = Math.round((sommeNotesPonderees / poidsTotal) * 100) / 100;
              }
            }

            uesWithNotes.push({
              id: ue.id,
              code: ue.code,
              libelle: ue.libelle,
              credits: parseInt(ue.nbre_credit) || 0,
              composite: ue.composite,
              notes: notesParEvaluation,
              moyenne: moyenneUE,
              statut:
                moyenneUE !== null
                  ? moyenneUE >= 10
                    ? "Validée"
                    : "Non validée"
                  : "En cours",
            });
          } catch (error) {
            console.error(`Erreur récupération UE ${ueId}:`, error);
            // Ajouter l'UE même sans notes
            try {
              const ueResponse = await api.get(`/notes/ues/${ueId}/`);
              const ue = ueResponse.data;
              uesWithNotes.push({
                id: ue.id,
                code: ue.code,
                libelle: ue.libelle,
                credits: parseInt(ue.nbre_credit) || 0,
                composite: ue.composite,
                notes: [],
                moyenne: null,
                statut: "Aucune note",
              });
            } catch (ueError) {
              console.error(`Impossible de récupérer l'UE ${ueId}:`, ueError);
            }
          }
        }
      }
      return uesWithNotes;
    } catch (error) {
      console.error("Erreur récupération UEs avec notes:", error);
      throw error;
    }
  },

  // Calculer les statistiques complètes de l'étudiant
  calculateMyStats: async () => {
    try {
      const uesWithNotes = await etudiantDashboardService.getMyUEsWithNotes();

      let totalCredits = 0;
      let creditsObtenus = 0;
      let totalNotes = 0;
      let nombreNotesValides = 0;
      let uesValidees = 0;

      uesWithNotes.forEach((ue) => {
        totalCredits += ue.credits;
        if (ue.moyenne !== null) {
          totalNotes += ue.moyenne;
          nombreNotesValides++;
          if (ue.moyenne >= 10) {
            uesValidees++;
            creditsObtenus += ue.credits;
          }
        }
      });

      const moyenneGenerale = nombreNotesValides > 0 ? totalNotes / nombreNotesValides : 0;
      const progressionPourcentage = totalCredits > 0 ? (creditsObtenus / totalCredits) * 100 : 0;

      return {
        uesValidees,
        creditsObtenus,
        totalCredits,
        moyenneGenerale: Math.round(moyenneGenerale * 100) / 100,
        progressionPourcentage: Math.round(progressionPourcentage),
        nombreUEsInscrites: uesWithNotes.length,
        nombreUEsAvecNotes: uesWithNotes.filter((ue) => ue.moyenne !== null).length,
        rang: null, // À implémenter plus tard
      };
    } catch (error) {
      console.error("Erreur calcul statistiques:", error);
      return {
        uesValidees: 0,
        creditsObtenus: 0,
        totalCredits: 0,
        moyenneGenerale: 0,
        progressionPourcentage: 0,
        nombreUEsInscrites: 0,
        nombreUEsAvecNotes: 0,
        rang: null,
      };
    }
  },
};

export default etudiantDashboardService;