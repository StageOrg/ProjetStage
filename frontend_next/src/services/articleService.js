import api from "./api";

const ArticleService = {
    // Récupérer tous les articles
    getMesArticles: async () => {
        try {
            const response = await api.get("/notes/articles/");
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la récupération de la liste des articles:", error);
            throw error;
        }
    },

    // Récupérer un article par ID
    getArticleById: async (id) => {
        try {
            const response = await api.get(`/notes/articles/${id}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'article ${id}:`, error);
            throw error;
        }
    },

    // Créer un nouvel article
    create: async (titre, journal, annee, lien) => {
        try {
            const articleData = { titre, journal, annee, lien };
            const response = await api.post("/notes/articles/", articleData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'article:", error);
            throw error;
        }
    },

    // Mettre à jour un article
    update: async (id, titre, journal, annee, lien) => {
        try {
            const articleData = { titre, journal, annee, lien };
            const response = await api.put(`/notes/articles/${id}/`, articleData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'article:", error);
            throw error;
        }
    },

    // Supprimer un article
    delete: async (id) => {
        try {
            const response = await api.delete(`/notes/articles/${id}/`);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'article:", error);
            throw error;
        }
    },

    getArticleByProfId: async (profId) => {
        try {
            const response = await api.get(`/notes/articles/par-professeur/${profId}/`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des articles pour le professeur ${profId}:`, error);
            throw error;
        }
    },
};

export default ArticleService;