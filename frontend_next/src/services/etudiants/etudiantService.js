// src/services/etudiants/etudiantService.js - VERSION SIMPLE

import api from "@/services/api";

const etudiantService = {
  //  Fonction principale - 
  getAllEtudiants: async (filters = {}) => {
    try {
      console.log("Recherche étudiants avec filtres:", filters);
      
      // Nettoyer les paramètres vides
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          cleanFilters[key] = filters[key];
        }
      });
      
      const response = await api.get("/utilisateurs/etudiants/", { 
        params: cleanFilters 
      });
      
      console.log(" Étudiants reçus:", response.data);
      return response.data;
    } catch (error) {
      console.error(" Erreur getAllEtudiants:", error);
      throw error;
    }
  },

  //  NOUVEAU : Récupère parcours avec relations
  getParcoursAvecRelations: async () => {
    try {
      console.log("Chargement parcours avec relations...");
      //  CORRECTION : URL dans inscription/ pas utilisateurs/
      const response = await api.get("/inscription/parcours-relations/");
      console.log("Parcours avec relations:", response.data);
      return response.data.parcours || [];
    } catch (error) {
      console.error(" Erreur getParcoursAvecRelations:", error);
      // Fallback vers l'ancienne méthode
      return await this.getParcours();
    }
  },

  //  Garder les méthodes existantes pour compatibilité
  getParcours: async () => {
    try {
      const response = await api.get("/inscription/parcours/");
      return response.data.results || response.data;
    } catch (error) {
      console.error("❌ Erreur getParcours:", error);
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
      console.error("❌ Erreur getFilieresByParcours:", error);
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
      console.error("❌ Erreur getAnneesByParcours:", error);
      throw error;
    }
  },

  //  Actions CRUD 
  deleteEtudiant: async (id) => {
    try {
      await api.delete(`/utilisateurs/etudiants/${id}/`);
    } catch (error) {
      console.error("❌ Erreur deleteEtudiant:", error);
      throw error;
    }
  },

  updateEtudiant: async (id, data) => {
    try {
      const response = await api.put(`/utilisateurs/etudiants/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error("❌ Erreur updateEtudiant:", error);
      throw error;
    }
  },

  // ✅ Export CSV simple
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