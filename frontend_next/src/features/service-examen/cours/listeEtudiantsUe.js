"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EtudiantService from "@/services/etudiantService";
import EvaluationNormale from "./evaluationNormale";
import EvaluationExamen from "./anonymat/evaluationExamen";
import UELibelle from "@/features/util/UELibelle";
import { useAnneeAcademique } from "@/contexts/AnneeAcademiqueContext";

function ListeEtudiantsUE({ ueId }) {
  const [etudiants, setEtudiants] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [anneeac, setAnneeac] = useState("");
  const [semestre, setSemestre] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [noEvaluation, setNoEvaluation] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  //const annee_id = localStorage.getItem("annee_id");
  const { annee } = useAnneeAcademique();



  useEffect(() => {
    const fetchData = async () => {
      if (!ueId || !annee) return;
      try {
        const res = await EtudiantService.getNotesByUE(ueId, annee.id);
        setEtudiants(res.etudiants);
        setEvaluations(res.evaluations);
        setAnneeac(res.annee_academique);
        setSemestre(res.semestre);
        // Si une seule évaluation existe, on la sélectionne automatiquement
        if (res.evaluations.length === 1) {
          setSelectedEvaluation(res.evaluations[0]);
        }
          setNoEvaluation(res.evaluations.length === 0);
      } catch (err) {
        console.error("Erreur récupération notes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ueId, annee]);

  //  Fonction pour calculer la moyenne pondérée d’un étudiant
  const calculerMoyenne = (etu) => {
    if (!evaluations.length) return "-";
    let totalPoids = 0;
    let total = 0;

    evaluations.forEach((ev) => {
      const note = etu.notes?.[ev.id];
      if (note !== undefined && note !== null) {
        total += note * (ev.poids / 100);
        totalPoids += ev.poids;
      }
    });

    if (totalPoids === 0) return "-";
    return total.toFixed(2);
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="bg-transparent px-8 py-10 w-full h-full animate-fade-in">
      <h2 className="font-bold text-2xl mb-4">Étudiants inscrits à l'ue <UELibelle ueId={ueId} /></h2>

      {/* Sélecteur d'évaluation */}
      <div className="mb-4 flex items-center gap-3">
        <label className="font-semibold">Type d'évaluation :</label>
        <select
          value={selectedEvaluation?.id || ""}
          onChange={(e) => {
            const evalChoisie = evaluations.find(
              (ev) => ev.id === parseInt(e.target.value)
            );
            setSelectedEvaluation(evalChoisie);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>-- Choisir --</option>
          {evaluations.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.type} ({ev.poids}%)
            </option>
          ))}
        </select>
        {noEvaluation && (
        <div className="bg-white-50 border border-blue-600 p-3 rounded-md my-3">
          <p className="text-black-800 mb-2">
            Pas d’évaluation pour cette UE.
          </p>
          <button
            onClick={() =>
              router.push(
                `/service-examen/notes/mes-ues/${ueId}/evaluations`
              )
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            ➕ En créer
          </button>
        </div>
      )}

       {!noEvaluation && (  
        <button
          onClick={() => router.push(`/service-examen/notes/mes-ues/${ueId}/evaluationsModify`)}
          className="ml-4 text-blue-600 underline"
        >
          Modifier les évaluations
        </button>
       )}
      </div>
     

      {/* Affichage du tableau selon le type d’évaluation  */}
     {selectedEvaluation ? (
      selectedEvaluation.type === "Examen" && selectedEvaluation.anonyme === null ? (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
      ⚠️ L'état d'anonymat de cette évaluation n'est pas encore défini.
        </div>
  ) : selectedEvaluation.type === "Examen" && selectedEvaluation.anonyme === true ? (
    <EvaluationExamen
      ueId={ueId}
      evaluations={evaluations}
      evaluation={selectedEvaluation}
      etudiants={etudiants}
      setEtudiants={setEtudiants}
      calculerMoyenne={calculerMoyenne}
      annee={annee}
      semestre={semestre}
      annee_id={annee.id}
    />
  ) : (
    <EvaluationNormale
      ueId={ueId}
      evaluations={evaluations}
      evaluation={selectedEvaluation}
      etudiants={etudiants}
      setEtudiants={setEtudiants}
      annee={annee}
      semestre={semestre}
      calculerMoyenne={calculerMoyenne}
    />
  )
) : (
  <p className="text-gray-500 italic">Veuillez sélectionner une évaluation.</p>
)}

    </div>
  );
}

export default ListeEtudiantsUE;
