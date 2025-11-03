// services/inscriptionService.js - VERSION CORRIGÉE
import api from "@/services/api";

const inscriptionService = {
  // Récupérer les UE filtrées
  getUEs: async (params) => {
    try {
      console.log("Envoi requête GET UE avec params:", params);
      const response = await api.get("/notes/ues/filtrer/", { params });
      console.log("Réponse UE reçue:", response.data);

      // Supporter les réponses paginées ({ results: [...] }) et non-paginées ([...])
      const data = response.data;
      if (!data) return [];
      // Si c'est un tableau, renvoyer tel quel
      if (Array.isArray(data)) return data;
      // Si la réponse contient .results (DRF paginé), renvoyer results, sinon renvoyer l'objet lui-même
      return data.results ?? data;
    } catch (error) {
      console.error("Erreur dans getUEs:", error);
      throw error;
    }
  },

  // Créer une inscription
  createInscription: async (data) => {
    try {
      console.log("Envoi requête POST inscription:", data);
      const response = await api.post("inscription/inscription/", data);
      console.log("Réponse inscription reçue:", response.data);
      return response.data.results;
    } catch (error) {
      console.error("Erreur dans createInscription:", error);
      throw error;
    }
  },

  // CORRECTION: Vérifier ancien étudiant avec gestion d'erreurs améliorée
  verifierAncienEtudiant: async (numCarte) => {
    try {
      console.log("Vérification ancien étudiant pour numéro:", numCarte);
      
      // S'assurer que numCarte n'est pas vide
      if (!numCarte || !numCarte.trim()) {
        throw new Error("Numéro de carte requis");
      }
      
      const response = await api.get(`/inscription/verifier-ancien-etudiant/${numCarte.trim()}/`);
      console.log("Réponse vérification reçue:", response.data);
      return response.data.results;
    } catch (error) {
      console.error("Erreur dans verifierAncienEtudiant:", error);
      
      // Gestion spécifique des erreurs
      if (error.response) {
        // Erreur de réponse du serveur
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          return {
            existe: false,
            message: "Numéro de carte non trouvé dans nos registres"
          };
        } else if (status === 400) {
          console.error("Erreur 400 détaillée:", data);
          throw new Error(data.error || "Données invalides");
        } else if (status === 500) {
          throw new Error("Erreur serveur. Veuillez réessayer plus tard.");
        }
      } else if (error.request) {
        // Erreur de réseau
        throw new Error("Problème de connexion. Vérifiez votre réseau.");
      }
      
      throw error;
    }
  },

  // Inscription des anciens étudiants
  inscriptionAncienEtudiant: async (data) => {
    try {
      console.log("Envoi requête POST inscription ancien étudiant:", data);
      const response = await api.post("/inscription/ancien-etudiant/", data);
      console.log("Réponse inscription ancien étudiant reçue:", response.data);
      return response.data.results;
    } catch (error) {
      console.error("Erreur dans inscriptionAncienEtudiant:", error);
      throw error;
    }
  }
};

export default inscriptionService;