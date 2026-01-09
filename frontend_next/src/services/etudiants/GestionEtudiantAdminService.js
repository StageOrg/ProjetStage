// src/services/etudiants/GestionEtudiantAdminService.js - VERSION COMPLÈTE
import api from "@/services/api";

// Cache local pour éviter les rechargements
let cache = {
  parcours: null,
  annees_academiques: null,
  timestamp: null
};

const CACHE_DURATION = 3600000; // 1 heure

const etudiantService = {
  /**
   * Récupère tous les étudiants avec filtres
   */
  getAllEtudiants: async (filters = {}) => {
    try {
      
      // Nettoyer les paramètres vides
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
   
      const response = await api.get("/inscription/etudiants/filtrer/", { 
        params: cleanFilters 
      });
      
      
      return {
        results: response.data.results || response.data || [],
        count: response.data.count || response.data.length || 0,
      };
    } catch (error) {
      console.error(" Erreur getAllEtudiants:", error);
      throw error;
    }
  },

  /**
   * Récupère les parcours avec leurs relations (filières, années)
   */
  getParcoursAvecRelations: async (forceRefresh = false) => {
    try {
      // Vérifier le cache local
      const now = Date.now();
      if (!forceRefresh && cache.parcours && cache.timestamp && (now - cache.timestamp < CACHE_DURATION)) {
        return cache.parcours;
      }
      
      const response = await api.get("/inscription/parcours-relations/");
      
      // Mettre à jour le cache
      cache.parcours = response.data.parcours || [];
      cache.timestamp = now;
      
      return cache.parcours;
    } catch (error) {
      console.error(" Erreur getParcoursAvecRelations:", error);
      // Fallback sur getParcours simple
      return await this.getParcours();
    }
  },

  /**
   *  Récupère les années académiques (avec cache)
   */
  getAnneesAcademiques: async (forceRefresh = false) => {
    try {
      // Vérifier le cache local
      const now = Date.now();
      if (!forceRefresh && cache.annees_academiques && cache.timestamp && (now - cache.timestamp < CACHE_DURATION)) {
        return cache.annees_academiques;
      }
      
      
      // Essayer d'abord l'endpoint avec cache
      try {
        const response = await api.get("/inscription/annees-academiques-cached/");
        cache.annees_academiques = response.data.annees || [];
        cache.timestamp = now;
        return cache.annees_academiques;
      } catch (err) {
        // Fallback sur endpoint classique
        const response = await api.get("/inscription/annee-academique/");
        const annees = response.data.results || response.data || [];
        cache.annees_academiques = annees;
        cache.timestamp = now;
        return annees;
      }
    } catch (error) {
      console.error(" Erreur getAnneesAcademiques:", error);
      // Retourner un tableau vide plutôt que de crasher
      return [];
    }
  },

  /**
   * Vide le cache local
   */
  clearCache: () => {
    cache = {
      parcours: null,
      annees_academiques: null,
      timestamp: null
    };
  },

  /**
   * Récupère les parcours (sans relations)
   */
  getParcours: async () => {
    try {
      const response = await api.get("/inscription/parcours/");
      return response.data.results || response.data;
    } catch (error) {
      console.error("Erreur getParcours:", error);
      throw error;
    }
  },

  /**
   * Récupère les filières d'un parcours
   */
  getFilieresByParcours: async (parcoursId = null) => {
    try {
      const params = parcoursId ? { parcours: parcoursId } : {};
      const response = await api.get("/inscription/filiere/", { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error(" Erreur getFilieresByParcours:", error);
      throw error;
    }
  },

  /**
   * Récupère les années d'étude d'un parcours
   */
  getAnneesByParcours: async (parcoursId = null) => {
    try {
      const params = parcoursId ? { parcours: parcoursId } : {};
      const response = await api.get("/inscription/annee-etude/", { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error(" Erreur getAnneesByParcours:", error);
      throw error;
    }
  },

  /**
   * Récupère les inscriptions d'un étudiant
   */
  getInscriptions: (etudiantId) => {
    return api.get(`/inscription/etudiants/${etudiantId}/inscriptions/`)
      .then((res) => res.data);
  },

  /**
   * Récupère les UEs d'une inscription
   */
  getUEsInscription: (inscriptionId) =>
    api.get(`/inscription/inscriptions/${inscriptionId}/ues/`)
      .then((res) => res.data),

  /**
   * Supprime un étudiant
   */
  /**
 * Supprime un étudiant ET ses inscriptions (via CASCADE)
 */
deleteEtudiant: async (id) => {
  try {
    
    await api.delete(`/utilisateurs/etudiants/${id}/`);
    
  } catch (error) {
    console.error(" Erreur deleteEtudiant:", error);
    throw error;
  }
},

  /**
   * Met à jour un étudiant
   */
  updateEtudiant: async (id, data) => {
    try {
      const response = await api.put(`/utilisateurs/etudiants/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error("Erreur updateEtudiant:", error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques d'inscriptions
   */
  getStatistiquesInscriptions: async (filters = {}) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      const response = await api.get("/inscription/stats/", {
        params: cleanFilters
      });
      return response.data;
    } catch (error) {
      console.error(" Erreur getStatistiquesInscriptions:", error);
      throw error;
    }
  },
  getStatistiquesAbandon: async (annee = "") => {
  const params = annee ? { annee_academique: annee } : {};
  const res = await api.get("/inscription/stats-abandons/", { params });
  return res.data;
  },
};

export default etudiantService;