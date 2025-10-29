import React from "react";
import Evaluations from "@/features/resp_notes/dashboard/gestion_evaluation/evaluations";

export default function PageEvaluations({params}){
    const {id} = React.use(params);
    return <Evaluations ue_id={id} />;
}