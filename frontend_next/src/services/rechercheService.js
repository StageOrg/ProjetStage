import api from "./api";

const RechercheService = {
    // Récupérer toutes les recherches
    getMesRecherches: async () => {
        try {
            const response = await api.get("/notes/recherches/");
            return response.data  ;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste des recherches:", error);
            throw error;
        }
    },

    // Récupérer une recherche par ID
    getRechercheById: async (id) => {
        try {
            const response = await api.get(`/notes/recherches/${id}/`);
            return response.data  ;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la recherche ${id}:`, error);
            throw error;
        }
    },

    // Créer une nouvelle recherche
    create: async (titre, description, date_debut, date_fin = null) => {
        try {
            const rechercheData = { titre, description, date_debut, date_fin };
            const response = await api.post("/notes/recherches/", rechercheData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de la recherche:", error);
            throw error;
        }
    },

    // Mettre à jour une recherche
    update: async (id, titre, description, date_debut, date_fin = null) => {
        try {
            const rechercheData = { type, titre, description, date_debut, date_fin };
            const response = await api.put(`/notes/recherches/${id}/`, rechercheData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la recherche:", error);
            throw error;
        }
    },

    // Supprimer une recherche
    delete: async (id) => {
        try {
            const response = await api.delete(`/notes/recherches/${id}/`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression de la recherche:", error);
            throw error;
        }
    },
    getRecherchesByProfId: async (profId) => {
        try {
            const response = await api.get(`/notes/recherches/par-professeur/${profId}/`);
            return response.data  ;
        } catch (error) {
            console.error(`Erreur lors de la récupération des recherches pour le professeur ${profId}:`, error);
            throw error;
        }   
    },
};

export default RechercheService;