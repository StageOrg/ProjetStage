import React from "react";

/**
 * Composant tableau réutilisable avec champs éditables selon condition.
 * 
 * @param {Array} colonnes - Liste des entêtes
 * @param {Array} donnees - Liste d'objets (lignes)
 * @param {String} evaluation - "Devoir", "Examen", etc.
 * @param {Number} editIndex - L'index actuellement en édition
 * @param {Function} onEditChange - Fonction déclenchée au changement d'un champ
 */
export default function TableauEditable({
  colonnes = [],
  donnees = [],
  evaluation = "",
  editIndex = null,
  onEditChange = () => {},
}) {
  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full border-separate border-spacing-y-2 text-xs sm:text-sm text-blue-900">
        <thead>
          <tr className="bg-white/90 text-blue-800 text-center shadow-md">
            {colonnes.map((col, idx) => (
              <th key={idx} className="px-2 sm:px-4 py-2 border-b border-teal-400 text-xs sm:text-sm">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {donnees.map((etudiant, index) => (
            <tr
              key={index}
              className="bg-white/70 rounded-xl shadow hover:bg-blue-50 transition text-center"
            >
              {colonnes.map((col, colIndex) => {
                const colKey = col.toLowerCase().replaceAll(" ", "_");

                const isEditable =
                  (evaluation === "Devoir" && colKey === "note_devoir") ||
                  (evaluation === "Examen" &&
                    (colKey === "note_examen" || colKey === "total_pondere"));

                const value = etudiant[colKey];

                return (
                  <td key={colIndex} className="px-2 sm:px-4 py-2">
                    {editIndex === index && isEditable ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          onEditChange(index, colKey, e.target.value)
                        }
                        className="w-12 sm:w-16 text-center border rounded bg-gray-100 disabled:opacity-50 text-xs sm:text-sm"
                        disabled={!isEditable}
                      />
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
