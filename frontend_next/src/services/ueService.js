import api from "./api"; 

const UEService = {
  getEtudiantsByUE: async (ueId) => {
    console.log("Fetching students for UE ID:", ueId);
  if (!ueId) {
    throw new Error("ueId est null ou undefined !");
  }
    const response = await api.get(`/notes/ues/${ueId}/etudiantsInscrits/`);
    console.log("Données reçues du backend:", response.data);
    return response.data;
  },
  getAllUE : async () => {
    const response = await api.get("/notes/ues/");
    return response.data;
  },
  creerUE : async (libelle,code, nbre_credit,composite,parcours,filiere,annee_etude,semestre) => {
    const ueData = { libelle, code, nbre_credit, composite, parcours, filiere, annee_etude, semestre };
    const response = await api.post("/notes/ues/", ueData);
    return response.data;
  },
  getUEById: async (id) => {
    const response = await api.get(`/notes/ues/${id}/`);
    return response.data;
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
