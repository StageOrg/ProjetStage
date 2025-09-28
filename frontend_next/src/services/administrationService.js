import api from "./api";

const DashboardService = {
  // Récupère les nombres d'étudiants, professeurs et UEs pour le tableau de bord
  getDashboardStats: async () => {
    try {
      // On fait les 3 requêtes en même temps pour être plus rapide
      const [reponseEtudiants, reponseProfesseurs, reponseUEs] = await Promise.all([
        api.get('/utilisateurs/etudiants/'),
        api.get('/utilisateurs/professeurs/'),
        api.get('/notes/ues/')
      ]);

      // Fonction pour comprendre combien d'éléments on a reçu
      const compterElements = (donnees) => {
        // Si l'API nous donne directement un nombre (format {count: 25})
        if (donnees && typeof donnees.count === 'number') {
          return donnees.count;
        }
        
        // Si l'API nous donne une liste paginée (format {results: [...]})
        if (donnees && Array.isArray(donnees.results)) {
          return donnees.results.length;
        }
        
        // Si l'API nous donne directement un tableau (format [...])
        if (Array.isArray(donnees)) {
          return donnees.length;
        }
        
        // Si on ne reconnaît pas le format, on retourne 0
        return 0;
      };

      // On retourne les nombres qu'on a calculés
      return {
        etudiants: compterElements(reponseEtudiants.data),
        professeurs: compterElements(reponseProfesseurs.data),
        ues: compterElements(reponseUEs.data),
        timestamp: new Date().toISOString() // Date de la dernière mise à jour
      };

    } catch (erreur) {
      // Si une requête échoue, on affiche l'erreur et on retourne des zéros
      console.error('Problème de connexion avec le serveur:', erreur);
      return {
        etudiants: 0,
        professeurs: 0,
        ues: 0,
        error: erreur.message
      };
    }
  }
};

export default DashboardService;