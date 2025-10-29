import api from "./api";
const ParcoursService = {
  getParcours: async () => {
    const response = await api.get("/inscription/parcours/");
    return response.data.results;
  },

  createParcours: async (libelle, abbreviation) => {
    console.log("📡 Tentative d'appel API avec :", libelle, abbreviation); 
    const parcoursData = { libelle, abbreviation };
    const response = await api.post("/inscription/parcours/", parcoursData);
    return response.data;
  }
};



export default ParcoursService;
