"use client";
import { useState, useRef } from "react";
import NoteService from "@/services/noteService";
import Export from "./export";
import PeriodeActive from "./periodeActive";
import SearchBar from "@/components/ui/SearchBar";


export default function EvaluationNormale({ueId, evaluations, evaluation, etudiants, setEtudiants, calculerMoyenne, annee, semestre }) {
  const periodeActive = PeriodeActive();
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [search, setSearch] = useState('');
  
  // Tableau de références pour chaque champ de note
  const inputRefs = useRef([]);

  const etudiantsFiltres = etudiants.filter((etu) =>
    etu.nom?.toLowerCase().includes(search.toLowerCase()) ||
    etu.prenom?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (index, etu) => {
    setEditIndex(index);
    setEditedData({ note: etu.notes[evaluation.id] ?? "" });
  };

  const handleSave = async (index, etu, moveToNext = false) => {
    const noteValue = parseFloat(editedData.note);
    if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
      alert("Note invalide (0–20).");
       setEditIndex(null);
      setEditedData({});
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
      
      if (moveToNext) {
        // Trouver l'index dans la liste filtrée
        const currentIndexInFiltered = etudiantsFiltres.findIndex(e => e.id === etu.id);
        const nextEtu = etudiantsFiltres[currentIndexInFiltered + 1];
        
        if (nextEtu) {
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
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un étudiant"
        className="w-[300px] mb-4"
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
            etudiantsFiltres.map(function(etu, index) {
              // Trouver l'index original dans la liste complète des étudiants
              const originalIndex = etudiants.findIndex(e => e.id === etu.id);
              
              return (
                <tr key={etu.id} className="even:bg-gray-50">
                  <td className="border px-2 py-1 text-center">{etu.num_carte}</td>
                  <td className="border px-2 py-1">{etu.nom}</td>
                  <td className="border px-2 py-1">{etu.prenom}</td>
                  <td className="border px-2 py-1 text-center">{etu.sexe}</td>
                  <td className="border px-2 py-1 text-center">
                    {editIndex === originalIndex ? (
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        disabled={!periodeActive}
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        value={editedData.note}
                        onChange={(e) => setEditedData({ note: e.target.value })}
                        onBlur={() => handleSave(originalIndex, etu, false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSave(originalIndex, etu, true);
                          }
                        }}
                        className="w-16 text-center border rounded"
                        autoFocus
                      />
                    ) : (
                      <span 
                        onClick={() => {
                          if (!periodeActive) {
                            alert("La période de saisie n'est pas active.");
                            return;
                          }
                          handleEdit(originalIndex, etu);
                        }}
                        className={periodeActive ? "cursor-pointer hover:bg-blue-50 px-2 py-1 rounded" : "text-gray-400"}
                      >
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
      <div className="mt-6 text-center">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          onClick={() => {
            alert("Notes enregistrées. Fin de la saisie.");
          }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}