import { authAPI } from "@/services/authService";
import api from "@/services/api";

const etudiantNotesService = {
  getMyCompleteData: async () => {
    try {
      const response = await authAPI.apiInstance().get("/utilisateurs/etudiants/me/");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération données étudiant:", error);
      throw error;
    }
  },

  getMyUEsWithNotes: async () => {
    try {
      const response = await api.get("/utilisateurs/etudiants/mes-ues-avec-notes/");
      console.log("Réponse de l'endpoint UEs avec notes:", response.data);

      if (!response.data || response.data.length === 0) return [];

      const formattedData = response.data.map(ue => ({
        id: ue.id,
        code: ue.code,
        libelle: ue.libelle,
        credits: ue.credits || parseInt(ue.nbre_credit) || 0,
        creditValide: ue.credit_valide || 0,
        composite: ue.composite || false,
        description: ue.description || "",
        semestre: ue.semestre || "Non spécifié",
        notes: ue.notes || [],
        moyenne: ue.moyenne,
        statut: ue.statut || "En cours",
        parcours: ue.parcours,
        filiere: ue.filiere,
        annee_etude: ue.annee_etude,
        annee_academique: ue.annee_academique
      }));

      return formattedData;
    } catch (error) {
      console.error("Erreur récupération UEs avec notes via endpoint dédié:", error);
      return [];
    }
  },

  getMyUEsOnly: async () => {
    try {
      const etudiantData = await etudiantNotesService.getMyCompleteData();
      const etudiantId = etudiantData.id;

      const inscriptionsResponse = await api.get("/inscription/inscription/", {
        params: { etudiant: etudiantId },
      });

      const inscriptions = inscriptionsResponse.data.results || inscriptionsResponse.data;
      if (!inscriptions || inscriptions.length === 0) return [];

      const uesData = [];

      for (const inscription of inscriptions) {
        if (inscription.ues?.length > 0) {
          for (const ueId of inscription.ues) {
            try {
              const ueResponse = await api.get(`/page_professeur/ues/${ueId}/`);
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
              console.warn(`Erreur récupération UE ${ueId}:`, ueError);
            }
          }
        }
      }

      return uesData;
    } catch (error) {
      console.error("Erreur récupération UEs seulement:", error);
      return [];
    }
  },

  getUEDetails: async (ueId) => {
    try {
      const uesResponse = await api.get("/utilisateurs/etudiants/mes-ues-avec-notes/");
      const ueDetails = uesResponse.data.find(ue => ue.id === parseInt(ueId));
      if (!ueDetails) throw new Error("UE non trouvée dans vos inscriptions");
      return ueDetails;
    } catch (error) {
      console.error(`Erreur récupération détails UE ${ueId}:`, error);
      throw error;
    }
  },

  getUENotesDetails: async (ueId) => {
    try {
      const etudiantData = await etudiantNotesService.getMyCompleteData();
      const etudiantId = etudiantData.id;

      const ueResponse = await api.get(`/page_professeur/ues/${ueId}/`);
      const ue = ueResponse.data;

      const notesResponse = await api.get(`/page_professeur/ues/${ueId}/notes/`);
      const notesData = notesResponse.data;

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
        creditValide: moyenneUE !== null && moyenneUE >= 10 ? parseInt(ue.nbre_credit) || 0 : 0
      };
    } catch (error) {
      console.error(`Erreur récupération détails notes UE ${ueId}:`, error);
      throw error;
    }
  },

  hasAcademicData: async () => {
    try {
      const ues = await etudiantNotesService.getMyUEsWithNotes();
      return ues.length > 0;
    } catch (error) {
      console.error("Erreur vérification données académiques:", error);
      return false;
    }
  },

  getNotesSummary: async () => {
    try {
      const uesWithNotes = await etudiantNotesService.getMyUEsWithNotes();
      const uesAvecNotes = uesWithNotes.filter(ue => ue.moyenne !== null);
      const uesSansNotes = uesWithNotes.filter(ue => ue.moyenne === null);

      return {
        totalUEs: uesWithNotes.length,
        uesAvecNotes: uesAvecNotes.length,
        uesSansNotes: uesSansNotes.length,
        uesValidees: uesAvecNotes.filter(ue => ue.moyenne >= 10).length,
        derniereMiseAJour: new Date().toISOString()
      };
    } catch (error) {
      console.error("Erreur récupération résumé notes:", error);
      return {
        totalUEs: 0,
        uesAvecNotes: 0,
        uesSansNotes: 0,
        uesValidees: 0,
        derniereMiseAJour: null
      };
    }
  }
};

export default etudiantNotesService;
