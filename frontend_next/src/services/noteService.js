import api from "./api"; 



const NoteService = {
  // Créer une note
  createNote: async (etudiantId, evaluationId, noteValue) => {
    try {
      const response = await api.post(
        "notes/notes/", 
        {
          etudiant: etudiantId,
          evaluation: evaluationId,
          note: noteValue,
        },
        
      );
      return response.data.results; // retourne la note créée
    } catch (error) {
      console.error("Erreur lors de la création de la note :", error.response?.data || error.message);
      throw error;
    }
  },
};

export default NoteService;
