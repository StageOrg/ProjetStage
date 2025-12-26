// src/services/EtudiantService.js
import api from "./api";


const EtudiantService = {
  async getNotesByUE(ueId) {
    const annee = localStorage.getItem("annee_id");
    console.log("Récupération des notes pour l'UE ID :", ueId, "et année académique :", annee);
    try {
      const response = await api.get(`/notes/ues/${ueId}/notes/?annee=${annee}`);
      console.log("reponse", response.data)
      return response.data; // JSON contenant etudiants + evaluations + notes

    } catch (error) {
      console.error("Erreur lors de la récupération des notes :", error);
      throw error;
    }
  },
  async getMesUes() {
    try {
      const response = await api.get(`/utilisateurs/etudiants/mes_ues/`);
      return response.data; // JSON contenant les UEs
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs :", error);
      throw error;
    }
  }

}

export default EtudiantService;