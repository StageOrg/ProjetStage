import api from "./api";
const FiliereService = {
  getFilieres: async () => {
    const response = await api.get("/inscription/filiere/");
    console.log("FiliereService response data:", response.data);
    return response.data;
  },
  createFiliere: async (nom, abbreviation, departement, parcours) => {
    const filiereData = { nom, abbreviation, departement, parcours };
    const response = await api.post("/inscription/filiere/", filiereData);
    return response.data;
  }
};

export default FiliereService;
