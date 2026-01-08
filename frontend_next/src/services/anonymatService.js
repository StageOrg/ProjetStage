import api from "./api";
const annee = localStorage.getItem("annee_id");
const AnonymatService = {
    // Lister tous les anonymats d'une UE
  listByUE: async (ueId) => {
    const response = await api.get(`notes/anonymats/by_ue/?ue=${ueId}&annee=${annee}`);
    return response.data;
  },

  // Créer un anonymat
  createAnonymat: async (etudiant, ue, numero, annee_academique) => {
    const response = await api.post(`/notes/anonymats/`, { etudiant, ue, numero, annee_academique });
    return response.data;
  },

  // Mettre à jour un anonymat
  updateAnonymat: async (id, etudiant, ue, numero, annee_academique) => {
    const response = await api.patch(`notes/anonymats/${id}/`, { etudiant, ue, numero, annee_academique });
    return response.data;
  },

  // Supprimer un anonymat
  deleteAnonymat: async (id) => {
    const response = await api.delete(`notes/anonymats/${id}/`);
    return response.data;
  },

  // Récupérer tous les anonymats
  getAll: async () => {
    const response = await api.get("notes/anonymats/");
    return response.data;
  },

  // Récupérer un anonymat précis
  getById: async (id) => {
    const response = await api.get(`notes/anonymats/${id}/`);
    return response.data;
  },
};

export default AnonymatService;
