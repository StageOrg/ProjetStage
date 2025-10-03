import api from "./api";

const AnneeEtudeService = {
  getAnneesEtude: async () => {
    const response = await api.get("inscription/annee-etude/");
    return response.data.results;
  },
};

export default AnneeEtudeService;
