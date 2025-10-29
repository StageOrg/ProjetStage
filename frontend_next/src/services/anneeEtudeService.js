import api from "./api";

const AnneeEtudeService = {
  getAnneesEtude: async () => {
    const response = await api.get("inscription/annee-etude/");
    return response.data.results;
  },
  createAnneeEtude: async (libelle, parcours, semestre) => {
    const data = { libelle, parcours, semestre };
    const response = await api.post("/inscription/annee-etude/", data);
    return response.data;
  }
};

export default AnneeEtudeService;
