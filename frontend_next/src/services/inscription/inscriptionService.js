// ========================================
// SERVICE - inscriptionService.js
// ========================================
// 📁 Emplacement : services/inscription/inscriptionService.js
// 🔄 Remplacer TOUT le contenu du fichier

import api from "@/services/api";

const inscriptionService = {
  /**
   * 🎯 Récupère les UE avec chargement intelligent
   * 
   * @param {Object} params - Paramètres de filtrage
   * @param {number} params.parcours - ID du parcours
   * @param {number} params.filiere - ID de la filière
   * @param {number} params.annee_etude - ID de l'année d'étude
   * 
   * @param {Object} options - Options de chargement
   * @param {boolean} options.isNewStudent - Si true, charge les niveaux précédents
   * @param {string} options.anneeLibelle - Libellé de l'année (ex: "Licence 2")
   */
  getUEs: async (params, options = {}) => {
    try {
      const { isNewStudent = false, anneeLibelle = null } = options;
      
      console.log("📡 getUEs - Appel avec:", { params, options });
      
      // 🔥 MODE MULTI-NIVEAUX pour nouveaux étudiants
      if (isNewStudent && anneeLibelle) {
        console.log("🚀 Mode MULTI-NIVEAUX activé");
        console.log("📚 Niveau sélectionné:", anneeLibelle);
        
        const response = await api.get("/inscription/ues/multi-niveaux/", { params });
        console.log("✅ Réponse multi-niveaux:", response.data);
        
        const data = response.data;
        
        return {
          ues: data.ues || [],
          niveaux_charges: data.niveaux_charges || [],
          niveau_selectionne: data.niveau_selectionne,
          total_ues: data.total_ues || 0
        };
      }
      
      // 📌 MODE STANDARD pour anciens étudiants
      console.log("📌 Mode STANDARD (ancien étudiant)");
      
      const response = await api.get("/notes/ues/filtrer/", { params });
      console.log("✅ Réponse standard:", response.data);
      
      const data = response.data;
      if (!data) return { ues: [], niveaux_charges: [], total_ues: 0 };
      
      // Support différents formats de réponse
      const ues = Array.isArray(data) ? data : (data.results || data.ues || []);
      
      return {
        ues,
        niveaux_charges: [],
        total_ues: ues.length
      };
      
    } catch (error) {
      console.error("❌ Erreur dans getUEs:", error);
      throw error;
    }
  },
  
  // Normaliser la réponse API
  _normalizeResponse: (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.results || data.ues || [];
  },
  
  // Créer une inscription
  createInscription: async (data) => {
    try {
      console.log("Envoi requête POST inscription:", data);
      const response = await api.post("inscription/inscription/", data);
      console.log("Réponse inscription reçue:", response.data);
      return response.data.results || response.data;
    } catch (error) {
      console.error("Erreur dans createInscription:", error);
      throw error;
    }
  },
  
  creerCompteEtudiant: async (data) => {
    try {
      const response = await api.post("/inscription/creer-compte-etudiant/", data);
      return response.data;
    } catch (error) {
      console.error("Erreur dans creerCompteEtudiant:", error);
      throw error;
    }
  },
  
  importerComptesEtudiants: async (formData) => {
    try {
      const response = await api.post("/inscription/creer-compte-etudiant/", formData, {
        responseType: "blob",
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Erreur dans importerComptesEtudiants:", error);
      throw error;
    }
  },
  
  renvoyerIdentifiants: async (data) => {
    try {
      const response = await api.post("/inscription/renvoyer-identifiants/", data);
      return response.data;
    } catch (error) {
      console.error("Erreur dans renvoyerIdentifiants:", error);
      throw error;
    }
  }
};

export default inscriptionService;