import api from "./api";

const EncadrementService = {
    // Récupérer tous les encadrements
    getMesEncadrements: async () => {
        try {
            const response = await api.get("/notes/encadrements/");
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste des encadrements:", error);
            throw error;
        }
    },

    // Récupérer un encadrement par ID
    getEncadrementById: async (id) => {
        try {
            const response = await api.get(`/notes/encadrements/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'encadrement ${id}:`, error);
            throw error;
        }
    },

    // Créer un nouvel encadrement
    create: async (type, titre, niveau, filiere, nom_etudiant, annee, lien) => {
        try {
            const encadrementData = { 
                type,
                titre, 
                niveau, 
                filiere, 
                nom_etudiant, 
                annee, 
                lien 
            };
            const response = await api.post("/notes/encadrements/", encadrementData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'encadrement:", error);
            throw error;
        }
    },

    // Mettre à jour un encadrement
    update: async (id, type, titre, niveau, filiere, nom_etudiant, annee, lien) => {
        try {
            const encadrementData = {  
                type,
                titre, 
                niveau, 
                filiere, 
                nom_etudiant, 
                annee, 
                lien 
            };
            const response = await api.put(`/notes/encadrements/${id}/`, encadrementData);
            return response.data ;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'encadrement:", error);
            throw error;
        }
    },

    // Supprimer un encadrement
    delete: async (id) => {
        try {
            const response = await api.delete(`/notes/encadrements/${id}/`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'encadrement:", error);
            throw error;
        }
    },
    getEncadrementsByProfId: async (profId) => {
        try {
            const response = await api.get(`/notes/encadrements/par-professeur/${profId}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des encadrements pour le professeur ${profId}:`, error);
            throw error;
        }
    },
};

export default EncadrementService;