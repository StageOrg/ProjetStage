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

  // Fonction pour récupérer le semestre
  const getSemestreLibelle = (ue) => {
    if (!ue.semestre) return "—";
    
    if (typeof ue.semestre === 'object' && ue.semestre.libelle) {
      return ue.semestre.libelle;
    }
    
    if (typeof ue.semestre === 'number' || typeof ue.semestre === 'string') {
      return `S${ue.semestre}`;
    }
    
    return "—";
  };

  return (
    <>
      {/* Ligne principale de l'UE */}
      <tr 
        className={`
          ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
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
            {getSemestreLibelle(ue)}
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
    const isComposante = ues.some(parentUe => 
      parentUe.composite && 
      parentUe.ues_composantes?.some(comp => comp.id === ue.id)
    );
    return !isComposante;
  });

  // Même logique pour les UEs d'ancien étudiant (non validées)
  const ancienPrincipales = (ancienUes || []).filter(ue => {
    const isComposante = (ancienUes || []).some(parentUe => 
      parentUe.composite && 
      parentUe.ues_composantes?.some(comp => comp.id === ue.id)
    );
    return !isComposante;
  });

  // 🆕 Grouper les UE par niveau (pour nouveaux étudiants)
  const uesGroupeesParNiveau = uesPrincipales.reduce((acc, ue) => {
    const niveau = ue.annee_info?.libelle || "Année actuelle";
    const niveauNum = ue.annee_info?.niveau || 999; // 999 pour tri en dernier
    
    if (!acc[niveau]) {
      acc[niveau] = { ues: [], niveauNum };
    }
    acc[niveau].ues.push(ue);
    return acc;
  }, {});

  // Trier les niveaux par ordre croissant
  const niveauxTries = Object.keys(uesGroupeesParNiveau).sort((a, b) => {
    return uesGroupeesParNiveau[a].niveauNum - uesGroupeesParNiveau[b].niveauNum;
  });

  // Vérifier si on a plusieurs niveaux
  const aPlusiersNiveaux = niveauxTries.length > 1;

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
            <>
              <tr>
                <td colSpan="5" className="px-3 py-3 bg-yellow-100 border border-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 bg-yellow-400"></div>
                    <span className="text-sm text-yellow-800 font-bold uppercase tracking-wide">
                      ⚠️ UE non validées (à rattraper)
                    </span>
                    <div className="h-1 flex-1 bg-yellow-400"></div>
                  </div>
                </td>
              </tr>
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
            </>
          )}

          {/* Section: UEs disponibles (groupées par niveau pour nouveaux étudiants) */}
          {uesPrincipales.length === 0 && ancienPrincipales.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-6 text-gray-500 border border-gray-300">
                {loading ? "Chargement des UE..." : "Aucune UE disponible"}
              </td>
            </tr>
          ) : (
            <>
              {niveauxTries.map((niveau, niveauIndex) => {
                const { ues: uesDuNiveau } = uesGroupeesParNiveau[niveau];
                
                return (
                  <React.Fragment key={niveau}>
                    {/* Séparateur de niveau (uniquement si plusieurs niveaux) */}
                    {aPlusiersNiveaux && (
                      <tr>
                        <td colSpan="5" className="px-3 py-3 bg-blue-50 border border-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="h-1 flex-1 bg-blue-300"></div>
                            <span className="text-sm text-blue-800 font-bold uppercase tracking-wide">
                              📚 {niveau}
                            </span>
                            <div className="h-1 flex-1 bg-blue-300"></div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* UEs du niveau */}
                    {uesDuNiveau.map((ue, index) => {
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
                  </React.Fragment>
                );
              })}
            </>
          )}
        </tbody>
      </table>

      {/* Footer avec statistiques */}
      <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-600">UE sélectionnées : </span>
            <span className="font-bold text-gray-800">
              {Object.values(selectedUEs).filter(Boolean).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total crédits : </span>
            <span className={`font-bold text-lg ${
              totalCreditsSelectionnes > LIMITE_CREDITS_MAX 
                ? 'text-red-600' 
                : totalCreditsSelectionnes > LIMITE_CREDITS_MAX * 0.8
                ? 'text-orange-600'
                : 'text-green-600'
            }`}>
              {totalCreditsSelectionnes} / {LIMITE_CREDITS_MAX}
            </span>
          </div>
        </div>
        {totalCreditsSelectionnes > LIMITE_CREDITS_MAX && (
          <div className="mt-2 text-xs text-red-600 font-semibold">
            ⚠️ Limite de crédits dépassée !
          </div>
        )}
      </div>
    </div>
  );
}