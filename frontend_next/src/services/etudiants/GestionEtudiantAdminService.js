import api from "@/services/api";

const etudiantService = {
  getAllEtudiants: async (filters = {}) => {
    try {
      console.log("Recherche étudiants avec filtres:", filters);
      
      // Nettoyer les paramètres vides
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      // Ajout d'un page_size large pour récupérer tous les résultats en une fois (supprime la pagination)
      cleanFilters.page_size = 1000;  // Ou une valeur max selon ton backend (ex. : 999999)
      
      const response = await api.get("/inscription/etudiants/filtrer/", { 
        params: cleanFilters 
      });
      
      console.log("Étudiants reçus:", response.data);
      
      // Retourner tous les résultats (pas de pagination)
      return {
        results: response.data.results || response.data || [],  // Utilise data directement si pas paginé
        count: response.data.count || response.data.length || 0,
      };
    } catch (error) {
      console.error("Erreur getAllEtudiants:", error);
      throw error;
    }
  },

  getParcoursAvecRelations: async () => {
    try {
      console.log("Chargement parcours avec relations...");
      const response = await api.get("/inscription/parcours-relations/");
      console.log("Parcours avec relations:", response.data);
      return response.data.parcours || [];
    } catch (error) {
      console.error("Erreur getParcoursAvecRelations:", error);
      return await this.getParcours();
    }
  },

  getParcours: async () => {
    try {
      const response = await api.get("/inscription/parcours/");
      return response.data.results || response.data;
    } catch (error) {
      console.error(" Erreur getParcours:", error);
      throw error;
    }
  },

  getFilieresByParcours: async (parcoursId) => {
    try {
      const response = await api.get("/inscription/filiere/", { 
        params: { parcours: parcoursId } 
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error(" Erreur getFilieresByParcours:", error);
      throw error;
    }
  },
  getInscriptions: (etudiantId) =>{
   console.log("Appel API: /inscription/etudiants/" + etudiantId + "/inscriptions/");
  return api.get(`/inscription/etudiants/${etudiantId}/inscriptions/`).then((res) => res.data);  },


  getUEsInscription: (inscriptionId) =>
    api.get(`/inscription/inscriptions/${inscriptionId}/ues/`).then((res) => res.data),

  getAnneesByParcours: async (parcoursId) => {
    try {
      const response = await api.get("/inscription/annee-etude/", { 
        params: { parcours: parcoursId } 
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error(" Erreur getAnneesByParcours:", error);
      throw error;
    }
  },

  deleteEtudiant: async (id) => {
  try {
    // Récupérer d'abord l'étudiant pour obtenir l'ID utilisateur
    const etudiantResponse = await api.get(`/utilisateurs/etudiants/${id}/`);
    const utilisateurId = etudiantResponse.data.utilisateur?.id || etudiantResponse.data.utilisateur;
    
    if (utilisateurId) {
      await api.delete(`/utilisateurs/${utilisateurId}/`);
    } else {
      await api.delete(`/utilisateurs/etudiants/${id}/`);
    }
  } catch (error) {
    console.error("Erreur deleteEtudiant:", error);
    throw error;
  }
},

  updateEtudiant: async (id, data) => {
    try {
      const response = await api.put(`/utilisateurs/etudiants/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(" Erreur updateEtudiant:", error);
      throw error;
    }
  },
  
  
  getStatistiquesInscriptions: async (filters = {}) => {
    try {
      console.log("Récupération des statistiques avec filtres:", filters);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      const response = await api.get("/inscription/stats/", {
        params: cleanFilters
      });
      console.log("Statistiques reçues:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur getStatistiquesInscriptions:", error);
      throw error;
    }
  },
};

export default etudiantService;