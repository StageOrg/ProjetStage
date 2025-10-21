import api from "./api";
const FiliereService = {
  getFilieres: async () => {
    const response = await api.get("/inscription/filiere/");
    console.log("FiliereService response data:", response.data);
    return response.data;
  },
  create: async (filiereData) => {
    const response = await api.post("/inscription/filiere/", filiereData);
    console.log("FiliereService create response data:", response.data);
    return response.data;
  }
};

export default FiliereService;
