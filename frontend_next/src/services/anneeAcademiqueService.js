import api from "./api";
const AnneeAcademiqueService = {
  getAll: async () => {
    const response = await api.get("/inscription/annee-academique/");
    return response.data;
  },
};

export default AnneeAcademiqueService;
