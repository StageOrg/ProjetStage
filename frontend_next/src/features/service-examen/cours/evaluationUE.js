import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import EvaluationService from "@/services/evaluationsService";
import { useRouter } from "next/navigation";

function EvaluationUE({ ueId, onRetour }) {
  const [evaluations, setEvaluations] = useState([]);
  const [type, setType] = useState("");
  const [poids, setPoids] = useState("");
  const [error, setError] = useState("");
  const Router = useRouter();
  // Récupération des évaluations (sécurisée)
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await EvaluationService.getEvaluationsByUE(ueId);
        setEvaluations(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Erreur récupération évaluations :", err);
        setEvaluations([]);
      }
    };
    if (ueId) fetch();
  }, [ueId]);

  // Somme des poids (force Number pour éviter concaténation de strings)
  const totalPoids = useMemo(
    () =>
      (Array.isArray(evaluations) ? evaluations : []).reduce(
        (sum, ev) => sum + (Number(ev?.poids) || 0),
        0
      ),
    [evaluations]
  );

  const totalOk = useMemo(() => Math.round(totalPoids) === 100, [totalPoids]);

  // Si on corrige etf qu'on atteint 100, on efface le message d'erreur automatiquement
  useEffect(() => {
    if (totalOk && error) setError("");
  }, [totalOk, error]);

  const handleCreate = async () => {
    try {
      if (!type || poids === "") {
        alert("Veuillez remplir tous les champs.");
        return;
      }
      const poidsValue = parseFloat(poids);
      if (Number.isNaN(poidsValue) || poidsValue < 0) {
        alert("Poids invalide.");
        return;
      }
      console.log("Creating evaluation with type:", type, "poids:", poidsValue, "for UE ID:", ueId);
      const res = await EvaluationService.createEvaluation(type, poidsValue, ueId);

      setEvaluations((prev) =>
        Array.isArray(prev) ? [...prev, res.data] : [res.data]
      );

      setType("");
      setPoids("");
      setError(""); // efface l'erreur si on créait quelque chose de correct
    } catch (err) {
      console.error("Erreur création évaluation :", err);
    }
  };

  const handleUpdate = async (id, newType, newPoids) => {
    try {
      const payload = { type: newType, poids: Number(newPoids) };
      const res = await EvaluationService.updateEvaluation(id, payload);
      setEvaluations((prev) =>
        Array.isArray(prev) ? prev.map((ev) => (ev.id === id ? res.data : ev)) : [res.data]
      );

      setError(""); // efface l'erreur après correction
    } catch (err) {
      console.error("Erreur mise à jour :", err);
    }
  };

  const handleRetour = () => {
    // on utilise totalOk (avec arrondi) pour éviter problèmes d'arrondi flottant
    if (totalOk) {
      setError("");
      if (onRetour) onRetour();
      else {
        alert("OK : somme = 100, retour à la saisie des notes.");
       Router.push(`/service-examen/notes/${ueId}/etudiants-inscrits`);
      }
    } else {
      setError(`La somme des poids est ${Number(totalPoids.toFixed(2))}%. Elle doit être égale à 100%.`);
    }
  };

  return (
    <div className="p-4">
      {/* Bouton retour */}
      <button
        onClick={handleRetour}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="mr-2" size={18} />
        Retour à la saisie des notes
      </button>

      <div className="mb-2 font-semibold">
        Total des poids :{" "}
        <span className={totalOk ? "text-green-600" : "text-red-600"}>
          {Number(totalPoids.toFixed(2))}%
        </span>
      </div>

      {/* Message d’erreur */}
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* Formulaire création */}
      <div className="mb-4">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setError(""); }}
          className="border px-2 py-1"
        >
          <option value="">-- Type --</option>
          <option value="Devoir">Devoir</option>
          <option value="Examen anticipé">Examen anticipé</option>
          <option value="Examen">Examen</option>
          <option value="Projet">Projet</option>
        </select>
        <input
          type="number"
          placeholder="Poids (%)"
          value={poids}
          min={0}
          max={100}
          step={10}
          onChange={(e) => { setPoids(e.target.value); setError(""); }}
          className="ml-2 border px-2 py-1"
        />
        <button
          onClick={handleCreate}
          className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
        >
          Créer
        </button>
      </div>

      {/* Liste des évaluations */}
      {Array.isArray(evaluations) && evaluations.length > 0 && (
        <ul className="space-y-2">
          {evaluations.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between border p-2 rounded">
              <span>{ev.type} - {ev.poids}%</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(ev.id, ev.type, Number(ev.poids) + 10)}
                  className="px-2 py-1 bg-green-500 text-white rounded"
                >
                  +10%
                </button>
                <button
                  onClick={() => handleUpdate(ev.id, ev.type, Math.max(0, Number(ev.poids) - 10))}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  -10%
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EvaluationUE;
