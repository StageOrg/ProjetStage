import api from "./api"; // Correction du chemin d'import

const ProjetService = {
    // Récupérer tous les projets (du professeur connecté)
    getMesProjets: async () => {
        try {
            const response = await api.get("/notes/projets/");
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste des projets:", error);
            throw error;
        }
    },

    //Recuperer les projets d'un prof par son ID
    getProjetsByProfId: async (profId) => {
        try {
            const response = await api.get(`/notes/projets/par-professeur/${profId}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des projets du professeur ${profId}:`, error);
            throw error;
        }
    },

    // Récupérer un projet par ID
    getProjetById: async (id) => {
        try {
            const response = await api.get(`/notes/projets/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération du projet ${id}:`, error);
            throw error;
        }
    },

    // Créer un nouveau projet
    create: async (titre, date_debut, date_fin, resume, lien) => {
        try {
            const projetData = { titre, date_debut, date_fin, resume, lien };
            const response = await api.post("/notes/projets/", projetData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création du projet:", error);
            throw error;
        }
    },

    // Mettre à jour un projet
    update: async (id, titre, date_debut, date_fin, resume, lien) => {
        try {
            const projetData = { titre, date_debut, date_fin, resume, lien };
            const response = await api.put(`/notes/projets/${id}/`, projetData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la mise à jour du projet:", error);
            throw error;
        }
    },

    // Supprimer un projet
    delete: async (id) => {
        try {
            const response = await api.delete(`/notes/projets/${id}/`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression du projet:", error);
            throw error;
        }
    }
};

export default ProjetService;