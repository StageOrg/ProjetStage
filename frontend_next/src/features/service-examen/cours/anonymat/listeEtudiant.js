import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EtudiantService from "@/services/etudiantService";
import EvaluationExamen from "./evaluationExamen";

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
        setSelectedEvaluation(res.evaluations.find(ev => ev.type === "Examen" && ev.anonyme === true));
        console.log("Evaluations fetched:", evaluations);
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
      <h2 className="font-bold text-2xl mb-4">Étudiants inscrits</h2>

        {selectedEvaluation ? (
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
        <p className="text-gray-500 italic">Veuillez sélectionner une évaluation.</p>
      )}
    </div>
  );
}

export default ListeEtudiantsUE;
