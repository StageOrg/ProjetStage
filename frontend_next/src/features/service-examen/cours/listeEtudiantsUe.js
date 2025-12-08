import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EtudiantService from "@/services/etudiantService";
import EvaluationNormale from "./evaluationNormale";
import EvaluationExamen from "./anonymat/evaluationExamen";
import UELibelle from "@/features/util/UELibelle";

function ListeEtudiantsUE({ ueId }) {
  const [etudiants, setEtudiants] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [annee, setAnnee] = useState("");
  const [semestre, setSemestre] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const annee_id = localStorage.getItem("annee_id");

  useEffect(() => {
    const fetchData = async () => {
      if (!ueId) return;
      try {
        const res = await EtudiantService.getNotesByUE(ueId);
        setEtudiants(res.etudiants);
        setEvaluations(res.evaluations);
        setAnnee(res.annee_academique);
        setSemestre(res.semestre);
        // Si une seule évaluation existe, on la sélectionne automatiquement
        if (res.evaluations.length === 1) {
          setSelectedEvaluation(res.evaluations[0]);
        }

        if (res.evaluations.length === 0) {
          router.push(`/service-examen/notes/mes-ues/${ueId}/evaluations`);
        }
      } catch (err) {
        console.error("Erreur récupération notes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ueId]);

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
        <button
          onClick={() => router.push(`/service-examen/notes/mes-ues/${ueId}/evaluations`)}
          className="ml-4 text-blue-600 underline"
        >
          Modifier les évaluations
        </button>
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
      annee_id={annee_id}
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
