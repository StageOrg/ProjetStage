import api from "./api";
const SemestreService = {
  getSemestres: async () => {
    const response = await api.get("/inscription/semestre/");
    return response.data.results;
  },
};

export default SemestreService;
