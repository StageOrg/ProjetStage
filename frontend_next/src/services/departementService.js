import api from "./api";
const DepartementService = {
  getDepartements: async () => {
    const response = await api.get("/inscription/departement/");
    return response.data;
  },
  createDepartement : async (nom, abbreviation, etablissement) => {
    const departementData = { nom, abbreviation, etablissement };
    const response = await api.post("/inscription/departement/", departementData);
    return response.data;
  },
  updateDepartement : async (id, nom, abbreviation, etablissement) => {
    const departementData = { nom, abbreviation, etablissement };
    const response = await api.put(`/inscription/departement/${id}/`, departementData);
    return response.data;
  },
  deleteDepartement : async (id) => {
    const response = await api.delete(`/inscription/departement/${id}/`);
    return response.data;
  }
};
export default DepartementService;