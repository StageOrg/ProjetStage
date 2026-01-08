import api from "./api"; 
const annee = localStorage.getItem("annee_id");
const EvaluationService = {
  getEvaluationsByUE: async (ueId) => {
    console.log("Fetching evaluations for UE ID:", ueId);
  if (!ueId) {
    throw new Error("ueId est null ou undefined !");
  }
    const response = await api.get(`/notes/ues/${ueId}/evaluations/?annee=${annee}`);
    console.log("evaluations:", response.data);
    return response.data  ;
  },

 async createEvaluation(type, poids, ueId) {
  console.log("Creating evaluation with type:", type, "poids:", poids, "for UE ID:", ueId);
    return await api.post(`/notes/evaluations/`, {
      ue: ueId,
      type,
      poids,
      annee_academique: annee,
    });
  },

  // Mettre à jour une évaluation existante
  async updateEvaluation(evaluationId, data) {
    console.log("Updating evaluation ID:", evaluationId, "with data:", data);
    return await api.patch(`/notes/evaluations/${evaluationId}/`, data);
  },

  // Supprimer une évaluation (optionnel)
  async deleteEvaluation(evaluationId) {
    return await api.delete(`/notes/evaluations/${evaluationId}/`);
  }
};

export default EvaluationService;
