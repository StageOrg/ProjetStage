import api from "./api";
const ParcoursService = {
  getParcours: async () => {
    const response = await api.get("/inscription/parcours/");
    return response.data;
  },

  createParcours: async (libelle, abbreviation) => {
    console.log("📡 Tentative d'appel API avec :", libelle, abbreviation); 
    const parcoursData = { libelle, abbreviation };
    const response = await api.post("/inscription/parcours/", parcoursData);
    return response.data;
  },
  updateParcours: async (id, libelle, abbreviation) => {
    const parcoursData = { libelle, abbreviation };
    const response = await api.put(`/inscription/parcours/${id}/`, parcoursData);
    return response.data;
  },
  deleteParcours: async (id) => {
    const response = await api.delete(`/inscription/parcours/${id}/`);
    return response.data;
  },
};



export default ParcoursService;
