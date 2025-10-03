import api from "./api"; 

const EvaluationService = {
  getEvaluationsByUE: async (ueId) => {
    console.log("Fetching evaluations for UE ID:", ueId);
  if (!ueId) {
    throw new Error("ueId est null ou undefined !");
  }
    const response = await api.get(`/notes/ues/${ueId}/evaluations/`);
    console.log("evaluations:", response.data);
    return response.data.results;
  },

 async createEvaluation(type, poids, ueId) {
  console.log("Creating evaluation with type:", type, "poids:", poids, "for UE ID:", ueId);
    return await api.post(`/notes/evaluations/`, {
      ue: ueId,
      type,
      poids,
    });
  },

  // Mettre à jour une évaluation existante
  async updateEvaluation(evaluationId, data) {
    return await api.patch(`/notes/evaluations/${evaluationId}/`, data);
    // data peut être {type: "Devoir"} ou {poids: 20}, ou les deux
  },

  // Supprimer une évaluation (optionnel)
  async deleteEvaluation(evaluationId) {
    return await api.delete(`/notes/evaluations/${evaluationId}/`);
  }
};

export default EvaluationService;
