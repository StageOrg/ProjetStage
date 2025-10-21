// src/services/EtudiantService.js
import api from "./api";


class EtudiantService {
  static async getNotesByUE(ueId) {
    const annee = localStorage.getItem("annee");
    console.log("Récupération des notes pour l'UE ID :", ueId, "et année académique :", annee);
    try {
      const response = await api.get(`/notes/ues/${ueId}/notes/?annee=${annee}`);
      return response.data; // JSON contenant etudiants + evaluations + notes
    } catch (error) {
      console.error("Erreur lors de la récupération des notes :", error);
      throw error;
    }
  }
}

export default EtudiantService;