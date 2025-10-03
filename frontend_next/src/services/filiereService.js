import api from "./api";
const FiliereService = {
  getFilieres: async () => {
    const response = await api.get("/inscription/filiere/");
    return response.data.results;
  },
};

export default FiliereService;
