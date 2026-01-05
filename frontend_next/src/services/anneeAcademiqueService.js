import api from "./api";
const AnneeAcademiqueService = {
  getAll: async () => {
    const response = await api.get("/inscription/annee-academique/");
    return response.data;
  },
  createAnneeAcademique: async (libelle) => {
    const data = { libelle };
    const response = await api.post("/inscription/annee-academique/", data);
    return response.data;
  },
  updateAnneeAcademique: async (id, libelle) => {
    const data = { libelle };
    const response = await api.put(`/inscription/annee-academique/${id}/`, data);
    return response.data;
  },
  deleteAnneeAcademique: async (id) => {
    const response = await api.delete(`/inscription/annee-academique/${id}/`);
    return response.data;
  }

};

export default AnneeAcademiqueService;
