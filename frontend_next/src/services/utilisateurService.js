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
  deleteUtilisateur: async (id) => {
    try {
      await api.delete(`/utilisateurs/utilisateurs/${id}/`);
      console.log(`Utilisateur avec ID ${id} supprimé.`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur avec ID ${id}:`, error);
      throw error;
    }
  },
  updateUtilisateur: async (id, data) => {
    try {
      const response = await api.put(`/utilisateurs/utilisateurs/${id}/`, data);
      console.log(`Utilisateur avec ID ${id} mis à jour:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur avec ID ${id}:`, error);
      throw error;
    }
  },
};

export default UtilisateurService;