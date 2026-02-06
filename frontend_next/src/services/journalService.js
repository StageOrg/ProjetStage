import api from "./api";

const JournalService = {

  getJournalActions: async () => {
    try {
      const response = await api.get("/utilisateurs/journal/");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération journal d'actions :", error);
      throw error;
    }
  },
};

export default JournalService;