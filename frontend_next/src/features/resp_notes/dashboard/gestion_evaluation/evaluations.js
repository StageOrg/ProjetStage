"use client";
import { useState, useEffect } from "react";
import EvaluationService from "@/services/evaluationsService";
import UELibelle from "@/features/util/UELibelle";
import { useAnneeAcademique } from "@/contexts/AnneeAcademiqueContext";


export default function Evaluations({ ue_id }) {
    const [evaluations, setEvaluations] = useState([]);
    const evaluationId = null;
    const { annee } = useAnneeAcademique();


    useEffect(() =>{
        async function fetchEvaluations(ue_id, annee){
            try {
                const data = await EvaluationService.getEvaluationsByUE(ue_id, annee.id);
                setEvaluations(data);
            } catch (error) {
                console.error("Erreur lors de la récupération des évaluations :", error);
            }
        }
       if(ue_id && annee) fetchEvaluations(ue_id, annee);
    }, [ue_id,annee]);

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
        <div className="p-8 max-w-3xl mx-auto">
  <h1 className="text-3xl font-bold mb-6 text-gray-800">
    Gestion des Évaluations de l'UE <UELibelle ueId={ue_id} />
  </h1>

  <ul className="space-y-6">
    {evaluations.length > 0 ? (
      evaluations.map((ev) => (
        <li
          key={ev.id}
          className="bg-white shadow-md rounded-xl p-5 border hover:shadow-lg transition-shadow"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-900">
              {ev.type}
            </span>
            <span className="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
              Poids : {ev.poids}%
            </span>
          </div>

          {/* Options examen */}
          {ev.type === "Examen" && (
            <div className="flex gap-10 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                <input
                  type="radio"
                  name={`anonymat-${ev.id}`}
                  value="anonyme"
                  checked={ev.anonyme === true}
                  onChange={() => handleAnonymatChange(ev.id, true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Anonymé</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
                <input
                  type="radio"
                  name={`anonymat-${ev.id}`}
                  value="non_anonyme"
                  checked={ev.anonyme === false}
                  onChange={() => handleAnonymatChange(ev.id, false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Non anonymé</span>
              </label>
            </div>
          )}
        </li>
      ))
    ) : (
      <li className="text-gray-500 text-center py-4">Aucune évaluation trouvée.</li>
    )}
  </ul>
</div>

    );
}
