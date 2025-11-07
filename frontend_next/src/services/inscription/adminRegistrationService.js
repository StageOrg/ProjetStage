// src/services/inscription/adminRegistrationService.js
import api from '@/services/api';

class AdminRegistrationService {
  async createEtudiantComplet(data, progressCallback = null) {
    const {
      first_name, last_name, email, telephone = null,
      date_naiss = null, lieu_naiss = null, num_carte = null,
      autre_prenom = null, sexe = 'M',
      parcours_id, filiere_id, annee_etude_id
    } = data;

    try {
      if (progressCallback) progressCallback(10, "Validation des données...");

      // Validation
      if (!email || !first_name || !last_name || !parcours_id || !filiere_id || !annee_etude_id) {
        throw new Error("Données obligatoires manquantes");
      }

      if (progressCallback) progressCallback(20, "Vérification unicité...");

      // Vérification email + num_carte
      await this.checkUniqueness(email, num_carte);

      if (progressCallback) progressCallback(40, "Création de l'étudiant...");

      // Appel direct à l'API backend
      const response = await api.post('/inscription/inscrire-etudiant/', {
        first_name, last_name, email, telephone,
        date_naiss, lieu_naiss, num_carte, autre_prenom, sexe,
        parcours: parcours_id,
        filiere: filiere_id,
        annee_etude: annee_etude_id
      });

      const result = response.data;

      if (progressCallback) progressCallback(90, "Envoi de l'email...");

      // Envoi du lien de connexion
      try {
        await api.post(`/inscription/envoyer-lien/${result.etudiant_id}/`);
      } catch (err) {
        console.warn("Échec envoi email, mais étudiant créé", err);
      }

      if (progressCallback) progressCallback(100, "Terminé !");

      return {
        username: result.username,
        password: result.mot_de_passe_temporaire,
        numero_inscription: result.numero_inscription,
        annee_academique: result.annee_academique,
        etudiant_id: result.etudiant_id
      };

    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Erreur inconnue";
      throw new Error(msg);
    }
  }

  async checkUniqueness(email, num_carte) {
    const checks = [];
    if (email) {
      checks.push(
        api.post('/auth/check_email/', { email }).then(r => {
          if (r.data.exists) throw new Error("Email déjà utilisé");
        })
      );
    }
    if (num_carte && /^\d{6}$/.test(num_carte)) {
      checks.push(
        api.post('/utilisateurs/check-num-carte/', { num_carte }).then(r => {
          if (r.data.exists) throw new Error("Numéro de carte déjà utilisé");
        })
      );
    }
    await Promise.all(checks);
  }
}

export default new AdminRegistrationService();