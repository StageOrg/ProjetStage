import api from "./api";
const FiliereService = {
  getFilieres: async () => {
    const response = await api.get("/inscription/filiere/");
    console.log("FiliereService response data:", response.data);
    return response.data;
  },
};

export default FiliereService;
