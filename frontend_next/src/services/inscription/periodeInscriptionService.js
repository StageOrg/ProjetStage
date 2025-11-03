
import api from "@/services/api";

const periodeInscriptionService = {
  /**
   * Récupérer toutes les périodes d'inscription
   */
  getAllPeriodes: async () => {
    try {
      const response = await api.get('/inscription/periode-inscription/');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération périodes:', error);
      throw error;
    }
  },

  /**
   * Récupérer la période active
   */
  getPeriodeActive: async () => {
    try {
      const response = await api.get('/inscription/periode-inscription/', {
        params: { active: true }
      });
      // Retourner la première période active trouvée
      return response.data.find(p => p.active) || null;
    } catch (error) {
      console.error('Erreur récupération période active:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle période d'inscription
   */
  createPeriode: async (data) => {
    try {
      const response = await api.post('/inscription/periode-inscription/', data);
      return response.data;
    } catch (error) {
      console.error('Erreur création période:', error);
      throw error;
    }
  },

  /**
   * Modifier une période d'inscription (PUT)
   */
  updatePeriode: async (id, data) => {
    try {
      const response = await api.put(`/inscription/periode-inscription/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur modification période:', error);
      throw error;
    }
  },

  /**
   * Modification partielle (PATCH) - utile pour activer/désactiver
   */
  patchPeriode: async (id, data) => {
    try {
      const response = await api.patch(`/inscription/periode-inscription/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur modification partielle période:', error);
      throw error;
    }
  },

  /**
   * Activer/Désactiver une période
   */
  toggleActive: async (id, active) => {
    try {
      const response = await api.patch(`/inscription/periode-inscription/${id}/`, { active });
      return response.data;
    } catch (error) {
      console.error('Erreur toggle active:', error);
      throw error;
    }
  },

  /**
   * Supprimer une période
   */
  deletePeriode: async (id) => {
    try {
      const response = await api.delete(`/inscription/periode-inscription/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression période:', error);
      throw error;
    }
  },

  /**
   * Vérifier si les inscriptions sont ouvertes (avec logique de dates)
   */
  verifierStatutInscriptions: async () => {
    try {
      const periode = await periodeInscriptionService.getPeriodeActive();
      
      if (!periode) {
        return {
          ouvert: false,
          statut: 'aucune_periode',
          message: 'Aucune période d\'inscription configurée'
        };
      }

      if (!periode.active) {
        return {
          ouvert: false,
          statut: 'fermee',
          message: 'Les inscriptions sont actuellement fermées',
          periode
        };
      }

      const now = new Date();
      const debut = new Date(periode.date_debut);
      const fin = new Date(periode.date_fin);

      if (now < debut) {
        return {
          ouvert: false,
          statut: 'non_commencee',
          message: `Les inscriptions commenceront le ${debut.toLocaleDateString('fr-FR')}`,
          periode
        };
      }

      if (now > fin) {
        return {
          ouvert: false,
          statut: 'expiree',
          message: `La période d'inscription s'est terminée le ${fin.toLocaleDateString('fr-FR')}`,
          periode
        };
      }

      return {
        ouvert: true,
        statut: 'en_cours',
        message: 'Les inscriptions sont ouvertes',
        periode
      };
    } catch (error) {
      console.error('Erreur vérification statut:', error);
      return {
        ouvert: false,
        statut: 'erreur',
        message: 'Erreur lors de la vérification du statut des inscriptions'
      };
    }
  }
};

export default periodeInscriptionService;