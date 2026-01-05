import api from "./api";
const SemestreService = {
  getSemestres: async () => {
    const response = await api.get("/inscription/semestre/");
    return response.data;
  },
  createSemestre: async (libelle) => {
    const semestreData = { libelle};
    const response = await api.post("/inscription/semestre/", semestreData);
    return response.data;
  },
  updateSemestre: async (id, libelle) => {
    const semestreData = { libelle };
    const response = await api.put(`/inscription/semestre/${id}/`, semestreData);
    return response.data;
  },
  deleteSemestre: async (id) => {
    const response = await api.delete(`/inscription/semestre/${id}/`);
    return response.data;
  }

};

export default SemestreService;
