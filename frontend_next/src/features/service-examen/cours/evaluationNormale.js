import { useState } from "react";
import NoteService from "@/services/noteService";
import Export from "./export";
import PeriodeActive from "./periodeActive";

export default function EvaluationNormale({ueId, evaluations, evaluation, etudiants, setEtudiants, calculerMoyenne, annee, semestre }) {
  const periodeActive = PeriodeActive();
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  const handleEdit = (index, etu) => {
    setEditIndex(index);
    setEditedData({ note: etu.notes[evaluation.id] ?? "" });
  };

  const handleSave = async (index, etu) => {
    const noteValue = parseFloat(editedData.note);
    if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
      alert("Note invalide (0–20).");
      return;
    }
    console.log("active", periodeActive);
    try {
      await NoteService.createNote(etu.id, evaluation.id, noteValue);
      setEtudiants((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, notes: { ...e.notes, [evaluation.id]: noteValue } }
            : e
        )
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
    }
  };

  return (
    <div className="bg-transparent px-8 py-10 w-full h-full animate-fade-in">
      <Export
        etudiants={etudiants}
        evaluations={evaluations}
        evaluation={evaluation}
        type="normal"
        annee={annee}
        semestre={semestre}
      />
      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">N° Carte</th>
            <th className="border px-2 py-1">Nom</th>
            <th className="border px-2 py-1">Prénom</th>
            <th className="border px-2 py-1">Sexe</th>
            <th className="border px-2 py-1 text-center">
              {evaluation.type} ({evaluation.poids}%)
            </th>
         </tr>
        </thead>
        <tbody>
          {etudiants.length === 0 ? (
            <tr>
              <td className="border p-2" colSpan="6">Aucun étudiant inscrit. Revoyez l'année académique que vous avez sélectionnée.</td>
            </tr>
          ) : (
            etudiants.map(function(etu, index) {
              return (
                <tr key={etu.id} className="even:bg-gray-50">
                  <td className="border px-2 py-1 text-center">{etu.num_carte}</td>
                  <td className="border px-2 py-1">{etu.nom}</td>
                  <td className="border px-2 py-1">{etu.prenom}</td>
                  <td className="border px-2 py-1 text-center">{etu.sexe}</td>
                  <td className="border px-2 py-1 text-center">
                    {editIndex === index ? (
                      <input
                        disabled={!periodeActive}
                        type="number"
                        min="0"
                        max="20"
                        value={editedData.note}
                        onChange={(e) => setEditedData({ note: e.target.value })}
                        onBlur={() => handleSave(index, etu)}
                        onKeyDown={(e) => e.key === "Enter" && handleSave(index, etu)}
                        className="w-16 text-center border rounded"
                        autoFocus
                      />
                    ) : (
                      <span onClick={() => handleEdit(index, etu)}>
                        {etu.notes[evaluation.id] ?? "-"}
                      </span>
                    )}
                  </td>
               
                </tr>
              );
            })
          )}

        </tbody>
      </table>
      <div className=" mt-6 text-center">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          onClick={() => {
            alert("Numéros anonymes enregistrés. Fin de la saisie.");
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
