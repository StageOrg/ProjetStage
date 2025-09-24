// frontend_next/src/services/etudiants/etudiantDashboardService.js
import { authAPI } from "@/services/authService";
import api from "@/services/api";

const etudiantDashboardService = {
  // Récupérer les données complètes de l'étudiant connecté
  getMyCompleteData: async () => {
    try {
      const response = await authAPI.apiInstance().get("/utilisateurs/etudiants/me/");
      console.log("Réponse brute de l'API:", response.data);
      
      // Traiter les données pour s'assurer qu'elles sont complètes
      const data = response.data;
      
      // S'assurer que les champs vides sont bien définis
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
      
      console.log("Données traitées:", processedData);
      return processedData;
    } catch (error) {
      console.error("Erreur récupération données étudiant:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      throw error;
    }
  },

  // Mettre à jour les données de l'étudiant
  updateMyData: async (formData) => {
    try {
      let dataToSend;
      
      // Si c'est un FormData (avec photo)
      if (formData instanceof FormData) {
        dataToSend = formData;
      } else {
        // Données JSON simples
        dataToSend = {
          email: formData.email || '',
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          telephone: formData.telephone || '',
          autre_prenom: formData.autre_prenom || '',
          // Ajouter d'autres champs si nécessaire
        };
      }

      const response = await authAPI.apiInstance().put("/utilisateurs/etudiants/me/", dataToSend);
      console.log("Réponse mise à jour:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("Erreur mise à jour données étudiant:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      throw error;
    }
  },

  // Récupérer les UEs avec les notes de l'étudiant
  getMyUEsWithNotes: async () => {
    try {
      // 1. Récupérer les données de l'étudiant
      const etudiantData = await etudiantDashboardService.getMyCompleteData();
      const etudiantId = etudiantData.id;

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