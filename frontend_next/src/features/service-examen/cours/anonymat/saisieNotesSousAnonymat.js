import { useState, useRef } from "react";
import NoteService from "@/services/noteService";
import Export from "../export";
import SearchBar from "@/components/ui/SearchBar";

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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tableau de références pour chaque champ de note
  const inputRefs = useRef([]);

  const handleSaveNote = async (index, etu, moveToNext = false) => {
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
      
      if (moveToNext) {
        // Trouver l'index dans la liste filtrée
        const currentIndexInFiltered = etudiantsFiltres.findIndex(e => e.id === etu.id);
        const nextEtu = etudiantsFiltres[currentIndexInFiltered + 1];
        
        if (nextEtu && nextEtu.num_anonymat) {
          const nextOriginalIndex = etudiants.findIndex(e => e.id === nextEtu.id);
          setEditIndex(nextOriginalIndex);
          setEditedData({ note: nextEtu.notes?.[evaluation.id] ?? "" });
        } else {
          setEditIndex(null);
        }
      } else {
        setEditIndex(null);
      }
    } catch (err) {
      console.error("Erreur enregistrement note :", err);
    }
  };

  const missingAnonymes = etudiants.some((e) => !e.num_anonymat);

  // Filtrer les étudiants selon la recherche
  const etudiantsFiltres = etudiants.filter((etu) => {
    if (!searchQuery.trim()) return true;
    const numAnonymat = etu.num_anonymat?.toString().toLowerCase() || "";
    return numAnonymat.includes(searchQuery.toLowerCase());
  });

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

      {/* Barre de recherche */}
      <div className="my-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par numéro d'anonymat..."
          className="max-w-md"
        />
      </div>

      <table className="w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-center">N° Anonymat</th>
            <th className="border px-2 py-1 text-center">Note</th>
          </tr>
        </thead>
        <tbody>
          {etudiantsFiltres.length === 0 ? (
            <tr>
              <td className="border p-2 text-center" colSpan="2">
                {searchQuery.trim() 
                  ? "Aucun numéro d'anonymat ne correspond à votre recherche."
                  : "Aucun étudiant inscrit. Revoyez l'année académique que vous avez sélectionnée."
                }
              </td>
            </tr>
          ) : (
            etudiantsFiltres.map((etu, index) => {
              // Trouver l'index original dans la liste complète des étudiants
              const originalIndex = etudiants.findIndex(e => e.id === etu.id);
              const currentNote = etu.notes?.[evaluation.id] ?? "";
              const canEdit = periodeActive && !!etu.num_anonymat;

              return (
                <tr key={etu.id} className="even:bg-gray-50">
                  <td className="border px-2 py-1 text-center">
                    {etu.num_anonymat ?? "-"}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {editIndex === originalIndex ? (
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        disabled={!canEdit}
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        value={editedData.note ?? currentNote}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, note: e.target.value }))
                        }
                        onBlur={() => handleSaveNote(originalIndex, etu, false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveNote(originalIndex, etu, true);
                          }
                        }}
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
                          setEditIndex(originalIndex);
                          setEditedData({ note: currentNote });
                        }}
                        className={canEdit ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded" : "text-gray-400"}
                      >
                        {currentNote !== "" ? currentNote : "-"}
                      </span>
                    )}
                    {!etu.num_anonymat && (
                      <div className="text-xs text-red-600 mt-1">Numéro anonymat manquant</div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Compteur de résultats */}
      {searchQuery.trim() && (
        <div className="text-sm text-gray-600 mt-2">
          {etudiantsFiltres.length} résultat{etudiantsFiltres.length > 1 ? 's' : ''} trouvé{etudiantsFiltres.length > 1 ? 's' : ''}
        </div>
      )}

      <div className="text-center mt-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
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