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
      console.log("🔍 Recherche étudiants avec filtres:", filters);
      
      // Nettoyer les paramètres vides
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      
      // Page size pour récupérer beaucoup de résultats
      cleanFilters.page_size = 1000;
      
      const response = await api.get("/inscription/etudiants/filtrer/", { 
        params: cleanFilters 
      });
      
      console.log("✅ Étudiants reçus:", response.data.results?.length || 0);
      
      return {
        results: response.data.results || response.data || [],
        count: response.data.count || response.data.length || 0,
      };
    } catch (error) {
      console.error("❌ Erreur getAllEtudiants:", error);
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
        console.log("📦 Parcours depuis cache local");
        return cache.parcours;
      }
      
      console.log("🌐 Chargement parcours avec relations...");
      const response = await api.get("/inscription/parcours-relations/");
      
      // Mettre à jour le cache
      cache.parcours = response.data.parcours || [];
      cache.timestamp = now;
      
      console.log("✅ Parcours chargés:", cache.parcours.length);
      return cache.parcours;
    } catch (error) {
      console.error("❌ Erreur getParcoursAvecRelations:", error);
      // Fallback sur getParcours simple
      return await this.getParcours();
    }
  },

  /**
   * 🆕 Récupère les années académiques (avec cache)
   */
  getAnneesAcademiques: async (forceRefresh = false) => {
    try {
      // Vérifier le cache local
      const now = Date.now();
      if (!forceRefresh && cache.annees_academiques && cache.timestamp && (now - cache.timestamp < CACHE_DURATION)) {
        console.log("📦 Années académiques depuis cache local");
        return cache.annees_academiques;
      }
      
      console.log("🌐 Chargement années académiques...");
      
      // Essayer d'abord l'endpoint avec cache
      try {
        const response = await api.get("/inscription/annees-academiques-cached/");
        cache.annees_academiques = response.data.annees || [];
        cache.timestamp = now;
        console.log("✅ Années académiques chargées (cached):", cache.annees_academiques.length);
        return cache.annees_academiques;
      } catch (err) {
        // Fallback sur endpoint classique
        console.log("⚠️ Endpoint cached non dispo, fallback sur endpoint classique");
        const response = await api.get("/inscription/annee-academique/");
        const annees = response.data.results || response.data || [];
        cache.annees_academiques = annees;
        cache.timestamp = now;
        console.log("✅ Années académiques chargées:", annees.length);
        return annees;
      }
    } catch (error) {
      console.error("❌ Erreur getAnneesAcademiques:", error);
      // Retourner un tableau vide plutôt que de crasher
      return [];
    }
  },

  /**
   * Vide le cache local
   */
  clearCache: () => {
    console.log("🗑️ Cache local vidé");
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
      console.error("❌ Erreur getParcours:", error);
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
      console.error("❌ Erreur getFilieresByParcours:", error);
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
      console.error("❌ Erreur getAnneesByParcours:", error);
      throw error;
    }
  },

  /**
   * Récupère les inscriptions d'un étudiant
   */
  getInscriptions: (etudiantId) => {
    console.log("📋 Appel API: /inscription/etudiants/" + etudiantId + "/inscriptions/");
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
      
      // Invalider le cache
      api.invalidateCache('etudiants');
    } catch (error) {
      console.error("❌ Erreur deleteEtudiant:", error);
      throw error;
    }
  },

  /**
   * Met à jour un étudiant
   */
  updateEtudiant: async (id, data) => {
    try {
      const response = await api.put(`/utilisateurs/etudiants/${id}/`, data);
      
      // Invalider le cache
      api.invalidateCache('etudiants');
      
      return response.data;
    } catch (error) {
      console.error("❌ Erreur updateEtudiant:", error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques d'inscriptions
   */
  getStatistiquesInscriptions: async (filters = {}) => {
    try {
      console.log("📊 Récupération des statistiques avec filtres:", filters);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ''
        )
      );
      const response = await api.get("/inscription/stats/", {
        params: cleanFilters
      });
      console.log("✅ Statistiques reçues");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur getStatistiquesInscriptions:", error);
      throw error;
    }
  },
};

export default etudiantService;