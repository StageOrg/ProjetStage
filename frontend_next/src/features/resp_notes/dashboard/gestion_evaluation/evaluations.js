"use client";
import { useState, useEffect } from "react";
import EvaluationService from "@/services/evaluationsService";


export default function Evaluations({ ue_id }) {
    const [evaluations, setEvaluations] = useState([]);
    const evaluationId = null;


    useEffect(() =>{
        async function fetchEvaluations(ue_id){
            try {
                const data = await EvaluationService.getEvaluationsByUE(ue_id);
                setEvaluations(data);
            } catch (error) {
                console.error("Erreur lors de la récupération des évaluations :", error);
            }
        }
       if(ue_id) fetchEvaluations(ue_id);
    }, [ue_id]);

    const handleAnonymatChange = async (evaluationId, value) => {
        try {
            await EvaluationService.updateEvaluation(evaluationId, { anonyme: value });
            setEvaluations((prev) =>
                prev.map((ev) =>
                    ev.id === evaluationId ? { ...ev, anonyme: value } : ev
                )
            );
            console.log("Anonymat mis à jour pour l'évaluation ID :", evaluationId);
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'anonymat :", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Gestion des Évaluations</h1>
           <ul>
            {evaluations.length > 0 ? evaluations.map((ev) => (
                <li key={ev.id} className="flex flex-col gap-2 border p-2 rounded mb-7">
                <div className="flex items-center justify-between">
                    <span>{ev.type} - {ev.poids}%</span> 
                </div>

                {/* Si c'est un examen, on affecte à evaluationId la valeur de ev.id et on affiche les options */}
                {ev.type === "Examen" && (
                 <div className="flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                        type="radio"
                        name={`anonymat-${ev.id}`} // groupe unique par évaluation
                        value= "anonyme"
                        checked={ev.anonyme === true} 
                        onChange={(e) => handleAnonymatChange(ev.id, true)}
                        />
                        Anonymé
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                        type="radio"
                        name={`anonymat-${ev.id}`}
                        value="non_anonyme"
                        checked={ev.anonyme === false}
                        onChange={(e) => handleAnonymatChange(ev.id, false)}
                        />
                        Non anonymé
                    </label>
                 </div>
                )}
                </li>
            )) : (
                <li className="py-2">Aucune évaluation trouvée.</li>
            )}
            </ul>

        </div>
    );
}
