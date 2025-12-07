import api from "./api";
const UtilisateurService = {
  // Récupère la liste des utilisateurs
  getAllUtilisateurs: async () => {
    try {
      const response = await api.get("/utilisateurs/utilisateurs/");
      console.log("Utilisateurs récupérés:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      throw error;
    }
  },

};

export default UtilisateurService;