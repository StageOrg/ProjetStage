import api from "./api";

const ImportExcelService = {
  // Fonction pour importer des UEs depuis un fichier Excel
  importUEs: async (formData) => {
            try {
            const response = await api.post("/notes/import-ues/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("✅ Importation réussie :", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Erreur d'import :", error.response?.data || error);
            throw error;
        }
    },

    // Fonction pour importer des utilisateurs depuis un fichier Excel
    importUsers: async (formData) => {
        try {
            const response = await api.post("/auth/import-excel/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("✅ Importation des utilisateurs réussie :", response.data);
            return response.data;
        } catch (error) {
            console.error("❌ Erreur d'import des utilisateurs :", error.response?.data || error);
            throw error;
        }
    }, 
    // Fonction pour télécharger le modèle Excel pour l'import des utilisateurs
    downloadTemplate: async () => {
        try {
            const response = await api.get("/utilisateurs/download-template/", {
                responseType: "blob", // Important pour les fichiers binaires
            });
            console.log("✅ Téléchargement du modèle réussi");
            return response.data;
        } catch (error) {
            console.error("❌ Erreur lors du téléchargement du modèle :", error.response?.data || error);
            throw error;
        }
    },

    // Fonction pour setter le mot de passe via token
    setPassword: async (token, password) => {
        try {
            const response = await api.post("/auth/set-password/", { token, password });
            console.log("✅ Mot de passe défini avec succès");
            return response.data;
        } catch (error) {
            console.error("❌ Erreur lors de la définition du mot de passe :", error.response?.data || error);
            throw error;
        }
    },
};

export default ImportExcelService;