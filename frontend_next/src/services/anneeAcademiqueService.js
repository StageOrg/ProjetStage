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
  }

};

export default AnneeAcademiqueService;
