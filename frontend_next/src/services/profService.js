import api from "./api"; 

const ProfesseurService = {
  // Récupérer tous les professeurs
  getAllProfesseurs: async () => {
    try {
      const response = await api.get(`utilisateurs/professeurs/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des professeurs", error);
      throw error;
    }
  },
  // Récupérer les UEs du professeur connecté
    getMesUes: async () => {
    try {
      const response = await api.get(`utilisateurs/professeurs/mes_ues/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs du professeur connecté", error);
      throw error;
    }
  },
  // Récupérer les UEs d'un professeur par son ID
  getMesUesId: async (professeurId) => {
    try {
      const response = await api.get(`utilisateurs/professeurs/${professeurId}/ues-prof/`);
      return response.data  ;
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs du professeur", error);
      throw error;
    }
  },
  // Récupérer un professeur par son ID
  getProfesseurById: async (id) => {
    try {
      const response = await api.get(`utilisateurs/professeurs/by-id/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du professeur", error);
      throw error;
    }
  },
  //Recuperer le professeur connecté
  getProfesseurConnecte: async () => {
    try {
      const response = await api.get(`utilisateurs/professeurs/me/`);
      console.log("Professeur connecté du service:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du professeur connecté", error);
      throw error;
    }
  },
  // Mettre à jour les informations du professeur connecté
 /*  updateProfesseurConnecte: async (profData) => {
    try { 
      const response = await api.patch(`utilisateurs/professeurs/me/`, profData);
      console.log("Mise à jour du professeur connecté réussie:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du professeur connecté", error);
      throw error;
    }
  } */
 // Dans votre profService.js

updateProfesseurConnecte: async (profData) => {
  try {
    // profData est déjà un FormData, pas besoin de le wrapper
    const response = await api.put('/utilisateurs/professeurs/me/', profData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log("Mise à jour du professeur connecté réussie:", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du professeur connecté", error);
    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
    }
    throw error;
  }
}
}
export default ProfesseurService;