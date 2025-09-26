import api from "@/services/api";

const etudiantService = {
  getAllEtudiants: async (filters = {}) => {
    try {
      console.log("Recherche étudiants avec filtres:", filters);
      
      // Nettoyer les paramètres vides et ignorer la pagination (page et page_size)
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== '' && !['page', 'page_size'].includes(key)
        )
      );
      
      const response = await api.get("/inscription/etudiants/filtrer/", { 
        params: cleanFilters 
      });
      
      console.log("Étudiants reçus:", response.data);
      
      // Retourner la réponse au format attendu
      return {
        results: response.data.results || [],
        count: response.data.count || 0,
        total_pages: response.data.total_pages || 1
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
      await api.delete(`/utilisateurs/etudiants/${id}/`);
    } catch (error) {
      console.error(" Erreur deleteEtudiant:", error);
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


  exportCSV: (etudiants) => {
    const headers = ['Num Carte', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Date Naissance'];
    const csvData = etudiants.map(etudiant => [
      etudiant.num_carte || '',
      etudiant.utilisateur?.last_name || '',
      etudiant.utilisateur?.first_name || '',
      etudiant.utilisateur?.email || '',
      etudiant.utilisateur?.telephone || '',
      etudiant.date_naiss || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
      
    return csvContent;
  }
};

export default etudiantService;