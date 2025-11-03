// components/inscription/UETable.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Composant pour une ligne d'UE
function UERow({ ue, index, isSelected, wouldExceedLimit, onCheckboxChange, isComposante = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isComposite = ue.composite && ue.ues_composantes && ue.ues_composantes.length > 0;

  const handleCheckboxClick = () => {
    if (isComposite) {
      const composantesIds = ue.ues_composantes.map(c => c.id);
      onCheckboxChange(ue.id, true, composantesIds);
    } else {
      onCheckboxChange(ue.id, false, []);
    }
  };

  return (
    <>
      {/* Ligne principale de l'UE */}
      <tr 
        className={`
          ${index % 2 === 0 ? "bg-white" : "bg-gray-100"} 
          ${wouldExceedLimit ? "opacity-50" : ""} 
          ${isSelected ? "bg-blue-50" : ""}
          ${isComposante ? "bg-gray-50" : ""}
        `}
      >
        <td className={`border border-gray-300 px-3 py-2 ${isComposante ? 'pl-8' : ''}`}>
          <div className="flex items-center gap-2">
            {isComposante && <span className="text-gray-400">↳</span>}
            <span className={isComposante ? "text-sm text-gray-600" : ""}>{ue.code}</span>
            {isComposite && !isComposante && (
              <span className="inline-block bg-purple-200 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                COMPOSITE
              </span>
            )}
          </div>
        </td>
        
        <td className="border border-gray-300 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className={isComposante ? "text-sm text-gray-700" : ""}>{ue.libelle}</span>
            {isComposite && !isComposante && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                title={isExpanded ? "Masquer les composantes" : "Afficher les composantes"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </td>
        
        <td className="border border-gray-300 px-3 py-2 text-center">
          <span className={isComposante ? "text-sm text-gray-600" : ""}>
            {ue.semestre || "—"}
          </span>
        </td>
        
        <td className="border border-gray-300 px-3 py-2 text-center">
          <span className={`font-semibold ${isComposante ? "text-sm text-gray-600" : ""}`}>
            {ue.nbre_credit}
          </span>
        </td>
        
        <td className="border border-gray-300 px-3 py-2 text-center">
          {isComposante ? (
            <span className="text-xs text-gray-400 italic">Auto-sélectionné</span>
          ) : (
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={handleCheckboxClick}
              disabled={wouldExceedLimit}
              className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          )}
        </td>
      </tr>

      {/* Lignes des composantes (si composite et expanded) */}
      {isComposite && isExpanded && ue.ues_composantes && (
        <>
          {ue.ues_composantes.map((composante, compIndex) => (
            <UERow
              key={`comp-${composante.id}`}
              ue={composante}
              index={index}
              isSelected={isSelected}
              wouldExceedLimit={false}
              onCheckboxChange={onCheckboxChange}
              isComposante={true}
            />
          ))}
        </>
      )}
    </>
  );
}

// Composant principal du tableau
export default function UETable({ 
  ues = [], 
  ancienUes = [], // UEs non-validées de l'étudiant (optionnel)
  selectedUEs = {}, 
  loading = false, 
  onCheckboxChange, 
  totalCreditsSelectionnes = 0, 
  LIMITE_CREDITS_MAX = 70 
}) {
  
  // Filtrer pour n'afficher que les UE principales (pas les composantes isolées)
  const uesPrincipales = ues.filter(ue => {
    // Vérifier si cette UE est une composante d'une autre UE
    const isComposante = ues.some(parentUe => 
      parentUe.composite && 
      parentUe.ues_composantes?.some(comp => comp.id === ue.id)
    );
    return !isComposante; // On n'affiche que les UE principales
  });

  // Même logique pour les UEs d'ancien étudiant (non validées)
  const ancienPrincipales = (ancienUes || []).filter(ue => {
    const isComposante = (ancienUes || []).some(parentUe => 
      parentUe.composite && 
      parentUe.ues_composantes?.some(comp => comp.id === ue.id)
    );
    return !isComposante;
  });

  return (
    <div className="overflow-x-auto mt-6">
      <table className="w-full border border-gray-300 text-sm text-gray-800">
        <thead className="bg-gray-200">
          <tr>
            <th className="border border-gray-300 px-3 py-2 text-left">Code</th>
            <th className="border border-gray-300 px-3 py-2 text-left">Libellé</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Semestre</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Crédit</th>
            <th className="border border-gray-300 px-3 py-2 text-center">Choix</th>
          </tr>
        </thead>

        <tbody>
          {/* Section: UEs non validées (ancien étudiant) */}
          {ancienPrincipales.length > 0 && (
            <tr>
              <td colSpan="5" className="px-3 py-2 bg-yellow-50 text-sm text-yellow-800 font-semibold">UE non validées</td>
            </tr>
          )}

          {ancienPrincipales.length === 0 && uesPrincipales.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-3 text-gray-500 border border-gray-300">
                {loading ? "Chargement des UE..." : "Aucune UE disponible"}
              </td>
            </tr>
          ) : (
            <>
              {ancienPrincipales.map((ue, index) => {
                const wouldExceedLimit =
                  !selectedUEs[ue.id] &&
                  totalCreditsSelectionnes + ue.nbre_credit > LIMITE_CREDITS_MAX;

                return (
                  <UERow
                    key={`ancien-${ue.id}`}
                    ue={ue}
                    index={index}
                    isSelected={selectedUEs[ue.id]}
                    wouldExceedLimit={wouldExceedLimit}
                    onCheckboxChange={onCheckboxChange}
                  />
                );
              })}

              {/* Section: UEs disponibles */}
              {uesPrincipales.length > 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-2 bg-white text-sm text-gray-800 font-semibold">UE disponibles</td>
                </tr>
              )}

              {uesPrincipales.map((ue, index) => {
                const wouldExceedLimit =
                  !selectedUEs[ue.id] &&
                  totalCreditsSelectionnes + ue.nbre_credit > LIMITE_CREDITS_MAX;

                return (
                  <UERow
                    key={ue.id}
                    ue={ue}
                    index={index}
                    isSelected={selectedUEs[ue.id]}
                    wouldExceedLimit={wouldExceedLimit}
                    onCheckboxChange={onCheckboxChange}
                  />
                );
              })}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}