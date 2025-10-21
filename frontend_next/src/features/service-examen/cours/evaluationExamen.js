import { useState } from "react";
import NoteService from "@/services/noteService";
import Export from "./export";
import AnonymatService from "@/services/anonymatService";
import PeriodeActive from "./periodeActive";

export default function EvaluationExamen({ ueId,evaluations, evaluation, etudiants, setEtudiants, calculerMoyenne, annee, semestre, annee_id }) {
  const periodeActive = PeriodeActive();
  const [phase, setPhase] = useState("anonymat"); 
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});

  
const handleChangeNumeroAnonyme = async (index, value) => {
  try {
    const updated = [...etudiants];
    const etu = updated[index];
    updated[index].num_anonymat = value; // mise à jour locale immédiate
    setEtudiants(updated);

    // Vérifier si l'étudiant a déjà un anonymat enregistré (num_anonyme existe)
    if (etu.num_anonyme_id) {
      //  Mettre à jour l'anonymat existant
      await AnonymatService.updateAnonymat(etu.num_anonyme_id, {
        etudiant: etu.id,
        ue: ueId,
        numero: value,
        annee_academique: annee_id
      });
    } else {
      //  Créer un nouvel anonymat
      const newAnonymat = await AnonymatService.createAnonymat(
        etu.id,
        ueId,
        value,
        annee_id
      );

      // Stocker l’ID de l’anonymat pour les futures mises à jour
      updated[index].num_anonyme_id = newAnonymat.id;
      setEtudiants([...updated]);
    }
  } catch (err) {
    console.error("Erreur lors de la mise à jour du numéro anonyme :", err);
  }
};


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
          i === index
            ? { ...e, notes: { ...e.notes, [evaluation.id]: noteValue } }
            : e
        )
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Erreur enregistrement note :", err);
    }
  };

  return (
    <div className="mt-6">
      {phase === "anonymat" ? (
        <>
          <h3 className="font-semibold mb-3">Saisie des numéros d’anonymat</h3>
        
          <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Nom</th>
                <th className="border px-2 py-1">Prénom</th>
                <th className="border px-2 py-1">Numéro Anonyme</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.map((etu, index) => (
                <tr key={etu.id} className="even:bg-gray-50">
                  <td className="border px-2 py-1">{etu.nom}</td>
                  <td className="border px-2 py-1">{etu.prenom}</td>
                  <td className="border px-2 py-1 text-center">
                    <input
                      disabled={!periodeActive}
                      type="text"
                      value={etu.num_anonymat}
                      onChange={(e) =>
                        handleChangeNumeroAnonyme(index, e.target.value)
                      }
                      className="w-24 text-center border rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              onClick={() => setPhase("notes")}
            >
              ➡ Saisir les notes sous anonymat
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold mb-3">Saisie des notes (sous anonymat)</h3>
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
                <th className="border px-2 py-1 text-center">N° Anonyme</th>
                <th className="border px-2 py-1 text-center">Note</th>
                <th className="border px-2 py-1 text-center">Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {etudiants
                .filter((e) => e.num_anonymat)
                .map((etu, index) => (
                  <tr key={etu.id} className="even:bg-gray-50">
                    <td className="border px-2 py-1 text-center">{etu.num_anonymat}</td>
                    <td className="border px-2 py-1 text-center">
                      {editIndex === index ? (
                        <input
                          disabled={!periodeActive}
                          type="number"
                          min="0"
                          max="20"
                          value={editedData.note}
                          onChange={(e) => setEditedData({ note: e.target.value })}
                          onBlur={() => handleSaveNote(index, etu)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveNote(index, etu)}
                          autoFocus
                          className="w-16 text-center border rounded"
                        />
                      ) : (
                        <span onClick={() => setEditIndex(index)}>
                          {etu.notes[evaluation.id] ?? "-"}
                        </span>
                      )}
                    </td>
                    <td className="border px-2 py-1 text-center font-semibold">
                      {calculerMoyenne(etu)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
