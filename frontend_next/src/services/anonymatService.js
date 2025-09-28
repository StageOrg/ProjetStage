import api from "./api";

const AnonymatService = {
    // Lister tous les anonymats d'une UE
  listByUE: async (ueId) => {
    const response = await api.get(`anonymats/by_ue/?ue=${ueId}`);
    return response.data;
  },

  // Créer un anonymat
  createAnonymat: async (etudiant, ue, numero) => {
    const response = await api.post("/anonymats/", { etudiant, ue, numero });
    return response.data;
  },

  // Mettre à jour un anonymat
  updateAnonymat: async (id, etudiant, ue, numero) => {
    const response = await api.put(`/anonymats/${id}/`, { etudiant, ue, numero });
    return response.data;
  },

  // Supprimer un anonymat
  deleteAnonymat: async (id) => {
    const response = await api.delete(`/anonymats/${id}/`);
    return response.data;
  },

  // Récupérer tous les anonymats
  getAll: async () => {
    const response = await api.get("/anonymats/");
    return response.data;
  },

  // Récupérer un anonymat précis
  getById: async (id) => {
    const response = await api.get(`/anonymats/${id}/`);
    return response.data;
  },
};

export default AnonymatService;
