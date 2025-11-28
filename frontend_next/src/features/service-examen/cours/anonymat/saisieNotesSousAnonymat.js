import { useState } from "react";
import NoteService from "@/services/noteService";
import Export from "../export";

export default function SaisieNotesSousAnonymat({
  etudiants,
  setEtudiants,
  evaluation,
  evaluations,
  calculerMoyenne,
  periodeActive,
  annee,
  semestre
}) {
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  const handleSaveNote = async (index, etu) => {
    const noteValue = parseFloat(editedData.note);
    if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
      alert("Note invalide (0–20).");
      return;
    }

    try {
      await NoteService.createNote(etu.id, evaluation.id, noteValue);
      setEtudiants((prev) =>
        prev.map((e, i) =>
          i === index ? { ...e, notes: { ...e.notes, [evaluation.id]: noteValue } } : e
        )
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Erreur enregistrement note :", err);
    }
  };

  const missingAnonymes = etudiants.some((e) => !e.num_anonymat);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3">Saisie des notes (sous anonymat)</h3>

      {missingAnonymes && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          Certains numéros anonymes ne sont pas encore attribués. Revenez plus tard pour finaliser la saisie des notes.
        </div>
      )}

      <Export
        etudiants={etudiants}
        evaluations={evaluations}
        evaluation={evaluation}
        type="examen"
        annee={annee}
        semestre={semestre}
      />

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-center">N° Anonymat</th>
            <th className="border px-2 py-1 text-center">Note</th>
            <th className="border px-2 py-1 text-center">Moyenne</th>
          </tr>
        </thead>
        <tbody>
          {/* Affichage de tous les étudiants.
              Si un étudiant n'a pas de numéro anonyme, la saisie est désactivée et une alerte
              informe l'utilisateur qu'il faut revenir plus tard. */}
          {etudiants.length === 0 ? (
            <tr>
              <td className="border p-2" colSpan="3">Aucun étudiant inscrit. Revoyez l'année académique que vous avez sélectionnée.</td>
            </tr>
          ) : (
            etudiants.map((etu, index) => {
              const currentNote = etu.notes?.[evaluation.id] ?? "";
              const canEdit = periodeActive && !!etu.num_anonymat;

            return (
              <tr key={etu.id} className="even:bg-gray-50">
                <td className="border px-2 py-1 text-center">
                  {etu.num_anonymat ?? "-"}
                </td>
                <td className="border px-2 py-1 text-center">
                  {editIndex === index ? (
                    <input
                      disabled={!canEdit}
                      type="number"
                      min="0"
                      max="20"
                      value={editedData.note ?? currentNote}
                      onChange={(e) =>
                        setEditedData((prev) => ({ ...prev, note: e.target.value }))
                      }
                      onBlur={() => handleSaveNote(index, etu)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveNote(index, etu)}
                      autoFocus
                      className="w-16 text-center border rounded"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (!periodeActive) {
                          alert("La période de saisie n'est pas active.");
                          return;
                        }
                        if (!etu.num_anonymat) {
                          alert(
                            "Revenez plus tard pour la saisie des notes, tous les numéros anonymes ne sont pas encore attribués."
                          );
                          return;
                        }
                        setEditIndex(index);
                        setEditedData({ note: currentNote });
                      }}
                      className={canEdit ? "cursor-pointer" : "text-gray-400"}
                    >
                      {currentNote !== "" ? currentNote : "-"}
                    </span>
                  )}
                  {!etu.num_anonymat && (
                    <div className="text-xs text-red-600 mt-1">Numéro anonymat manquant</div>
                  )}
                </td>
                <td className="border px-2 py-1 text-center font-semibold">
                  {calculerMoyenne(etu)}
                </td>
              </tr>
            );
          }))} 
        </tbody>
      </table>
      <div className="text-center mt-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={() => {
            if (missingAnonymes) {
              alert(
                "Impossible d'enregistrer : certains numéros anonymes ne sont pas encore attribués. Revenez plus tard."
              );
              return;
            }
            alert("Numéros anonymes enregistrés. Fin de la saisie.");
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}
