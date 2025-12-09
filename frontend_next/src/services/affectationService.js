import api from "./api";

const AffectationService = {
    affecter : async(ue,professeur)=> {
        const response = await api.post("notes/affectations/", { ue, professeur });
        return response.data;
    },
    desaffecter : async(ue,professeur)=> {
        const response = await api.delete("notes/affectations/", { data: { ue, professeur } });
        return response.data;
    },
};

export default AffectationService;