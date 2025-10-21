import api from "./api";

const PeriodeSaisieService = {
    getAll: async () => {
        try{ 
            const response = await api.get("notes/periodes/");
            console.log("Périodes de saisie récupérées :", response.data);
            return response.data;
        }
        catch(error) {
            console.error("Erreur lors de la recuperation des periodes de saisie de notes");
            throw error;
        }
        
    },
    create: async (numero, date_debut, date_fin) => {
        console.log("Creating periode with data:", { numero, date_debut, date_fin });
        try{
            const response = await api.post("notes/periodes/", { numero, date_debut, date_fin });
            return response.data.results;

        }
        catch(error){
            console.error("Erreur lors de la creation de la periode de saisie de notes", error.response?.data || error.message);
            throw error;
        }
       
    },
    update: async (id, numero, date_debut, date_fin) => {
        try{
             const response = await api.put(`notes/periodes/${id}/`, { numero, date_debut, date_fin });
            return response.data;
        }
        catch(error){
            console.error("Erreur lors de la mise à jour de la periode");
            throw error;
        }
       
    },
    delete: async (id) => {
        try{
            const response = await api.delete(`notes/periodes/${id}/`);
            return response.data;
        }
        catch(error){
            console.error("Erreur lors de la suppression de la periode");
            throw error;
        }
        
    }
};

export default PeriodeSaisieService;
