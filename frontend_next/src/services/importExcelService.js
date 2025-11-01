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
};

export default ImportExcelService;