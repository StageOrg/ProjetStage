import api from "./api"; 

const ProfesseurService = {
  getAllProfesseurs: async () => {
    try {
      const response = await api.get(`utilisateurs/professeurs/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des professeurs", error);
      throw error;
    }
  },
    getMesUes: async () => {
    try {
      const response = await api.get(`utilisateurs/professeurs/mes_ues/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs du professeur connecté", error);
      throw error;
    }
  },
  getMesUesId: async (professeurId) => {
    try {
      const response = await api.get(`utilisateurs/professeurs/${professeurId}/ues-prof/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs du professeur", error);
      throw error;
    }
  }
}
export default ProfesseurService;