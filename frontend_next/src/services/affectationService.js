import api from "./api";

const AffectationService = {
    affecter : async(ue,professeur)=> {
        const response = await api.post("notes/affectations/", { ue, professeur });
        return response.data.results;
    },
};

export default AffectationService;