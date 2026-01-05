import api from "./api";

const AnneeEtudeService = {
  getAnneesEtude: async () => {
    const response = await api.get("inscription/annee-etude/");
    return response.data;
  },
  createAnneeEtude: async (libelle, parcours, semestre) => {
    const data = { libelle, parcours, semestre };
    const response = await api.post("/inscription/annee-etude/", data);
    return response.data;
  },
  updateAnneeEtude: async (id, libelle, parcours, semestre) => {
    const data = { libelle, parcours, semestre };
    const response = await api.put(`/inscription/annee-etude/${id}/`, data);
    return response.data;
  },
  deleteAnneeEtude: async (id) => {
    const response = await api.delete(`/inscription/annee-etude/${id}/`);
    return response.data;
  }
};

export default AnneeEtudeService;
