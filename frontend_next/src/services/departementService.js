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
  }
};
export default DepartementService;