import api from "./api"; 

const UEService = {
  getEtudiantsByUE: async (ueId) => {
    console.log("Fetching students for UE ID:", ueId);
  if (!ueId) {
    throw new Error("ueId est null ou undefined !");
  }
    const response = await api.get(`/notes/ues/${ueId}/etudiantsInscrits/`);
    console.log("Données reçues du backend:", response.data);
    return response.data.results;
  },
  getAllUE : async () => {
    const response = await api.get("/notes/ues/");
    console.log("Données reçues du backend:", response.data);
    return response.data;
  },
  // Récupérer les UE associées à des évaluations d'examen anonymés
  getUEByEvaluation: async () => {
    const response = await api.get(`/notes/ues/filter-examen/`);
    return response.data;
  },

  //Recuperation des ues associées à des evaluations anonymés et pour lesquelles aucune note n'a été saisie
  getUEByEvaluationSansNote: async () => {
    const response = await api.get(`/notes/ues/ues-anonymes-sans-notes/`);
    return response.data;
  },

  // Création d'une nouvelle UE
  creerUE : async (libelle,code, nbre_credit,composite,parcours,filiere,annee_etude,semestre) => {
    const ueData = { libelle, code, nbre_credit, composite, parcours, filiere, annee_etude, semestre };
    const response = await api.post("/notes/ues/", ueData);
    return response.data;
  },
  getUEById: async (id) => {
    const response = await api.get(`/notes/ues/${id}/`);
    return response.data.results;
  },
  // Mise à jour partielle (description + liens)
  updateUE: async (id, data) => {
    const response = await api.patch(`/notes/ues/${id}/`, data);
    return response.data;
  },
  // Suppression d'une UE
  deleteUE: async (id) => {
    const response = await api.delete(`/notes/ues/${id}/`);
    return response.data;
  }
};


export default UEService;
