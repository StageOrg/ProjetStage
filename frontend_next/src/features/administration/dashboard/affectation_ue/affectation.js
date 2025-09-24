"use client";

import { useState, useEffect } from "react";
import ProfesseurService from "@/services/profService";
import UEService from "@/services/ueService";
import AffectationService from "@/services/affectationService";

export default function AffectationUE() {
  const [professeurs, setProfesseurs] = useState([]);
  const [ues, setUes] = useState([]);
  const [selectedProf, setSelectedProf] = useState(null);
  const [profUes, setProfUes] = useState([]);
  const [showUESelector, setShowUESelector] = useState(false);
  const [selectedUEs, setSelectedUEs] = useState([]);

  // Récupérer les professeurs et UEs au chargement
  useEffect(() => {
    async function fetchData() {
      try {
        const profData = await ProfesseurService.getAllProfesseurs();
        setProfesseurs(profData);

        const ueData = await UEService.getAllUE();
        setUes(ueData);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      }
    }
    fetchData();
  }, []);

  // Sélection d’un prof
  const handleSelectProf = async (prof) => {
    setSelectedProf(prof);
    setShowUESelector(false);
    setSelectedUEs([]);

    // récupérer les UEs de ce prof
    try {
      const profUeData = await ProfesseurService.getMesUesId(prof.id);
      setProfUes(profUeData); // attend un tableau d'UE avec au moins id et nom
    } catch (error) {
      console.error("Erreur lors de la récupération des UEs du prof :", error);
      setProfUes([]);
    }
  };

  // Toggle sélection d'une UE à affecter
  const handleToggleUE = (ue) => {
    if (selectedUEs.includes(ue.id)) {
      setSelectedUEs(selectedUEs.filter((id) => id !== ue.id));
    } else {
      setSelectedUEs([...selectedUEs, ue.id]);
    }
  };

  const handleAddUE = () => {
    setShowUESelector(true);
  };

const handleValidate = async ( ) => {
  if (!selectedProf || selectedUEs.length === 0) return;
  try {
    // Vérifier combien d'UEs sont sélectionnées
    console.log("Nombre d'UEs à affecter :", selectedUEs.length);

    // Boucler sur chaque UE et appeler l'API
    for (let i = 0; i < selectedUEs.length; i++) {
      let ueId = selectedUEs[i];
      await AffectationService.affecter(ueId, selectedProf.id);
      console.log(`UE ${ueId} affectée au prof ${selectedProf.id}`);
    }

    // Mettre à jour localement pour un retour immédiat
    const nouvellesUes = ues.filter((ue) => selectedUEs.includes(ue.id));
    setProfUes((prev) => [...prev, ...nouvellesUes]);

    // Réinitialiser la sélection et fermer le sélecteur
    setSelectedUEs([]);
    setShowUESelector(false);

    console.log("Toutes les UEs ont été affectées avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'affectation :", error);
    console.log(`UE ${ueId} non affectée au prof ${selectedProf.id}`);
  }
};

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Affectation des UEs aux professeurs</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Colonne gauche : Liste des professeurs */}
        <div>
          <h3 className="font-semibold mb-2">Liste des professeurs</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Nom</th>
                <th className="border p-2">Prénom</th>
                <th className="border p-2">Titre</th>
              </tr>
            </thead>
            <tbody>
              {professeurs.map((prof) => (
                <tr
                  key={prof.id}
                  className={`cursor-pointer hover:bg-gray-100 ${
                    selectedProf?.id === prof.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => handleSelectProf(prof)}
                >
                  <td className="border p-2">{prof.utilisateur.first_name}</td>
                  <td className="border p-2">{prof.utilisateur.last_name}</td>
                  <td className="border p-2">{prof.titre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Colonne droite : UEs du prof sélectionné */}
        <div>
          {selectedProf ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                UEs de {selectedProf.titre} {selectedProf.utilisateur.last_name} {selectedProf.utilisateur.first_name}
              </h3>

              <button
                onClick={handleAddUE}
                className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
              >
                ➕ Affecter une UE
              </button>

              {/* Liste des UEs déjà affectées */}
              {profUes.length > 0 ? (
                <ul className="list-disc ml-6 mb-4">
                  {profUes.map((ue) => (
                    <li key={ue.code}>{ue.libelle}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mb-4">Aucune UE affectée.</p>
              )}

              {/* Sélecteur d’UEs à affecter */}
              {showUESelector && (
                <div className="p-4 border rounded bg-gray-50">
                  <h4 className="font-medium mb-2">Sélectionnez les UEs à affecter :</h4>
                  <table className="w-full border-collapse border border-gray-300 mb-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2">Choisir</th>
                        <th className="border p-2">Nom de l’UE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ues.map((ue) => (
                        <tr key={ue.id}>
                          <td className="border p-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUEs.includes(ue.id)}
                              onChange={() => handleToggleUE(ue)}
                              disabled={profUes.some((pu) => pu.id === ue.id)}
                            />
                          </td>
                          <td
                            className={`border p-2 ${
                              profUes.some((pu) => pu.id === ue.id)
                                ? "text-gray-400 italic"
                                : ""
                            }`}
                          >
                            {ue.libelle}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    onClick={handleValidate}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    ✅ Valider
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Sélectionnez un professeur à gauche.</p>
          )}
        </div>
      </div>
    </div>
  );
}
