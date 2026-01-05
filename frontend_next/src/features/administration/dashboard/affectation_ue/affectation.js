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

  // ✅ Filtres
  const [searchProf, setSearchProf] = useState("");
  const [searchUE, setSearchUE] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const profData = await ProfesseurService.getAllProfesseurs();
        setProfesseurs(profData);

        const ueData = await UEService.getAllUE();
        setUes(ueData);
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      }
    }
    fetchData();
  }, []);

  const handleSelectProf = async (prof) => {
    setSelectedProf(prof);
    setShowUESelector(false);
    setSelectedUEs([]);

    try {
      const profUeData = await ProfesseurService.getMesUesId(prof.id);
      setProfUes(profUeData);
    } catch (error) {
      console.error("Erreur récupération UEs :", error);
      setProfUes([]);
    }
  };

  // ✅ Toggle avec affectation ET désaffectation
  const handleToggleUE = async (ue) => {
    const isAlreadyAffected = profUes.some((pu) => pu.id === ue.id);

    try {
      if (isAlreadyAffected) {
        if (window.confirm("Êtes-vous sûr de vouloir désaffecter cette UE ?")) {

        // ✅ DESAFFECTATION
        await AffectationService.desaffecter(selectedProf.id, ue.id);

        setProfUes((prev) => prev.filter((u) => u.id !== ue.id));
        setSelectedUEs((prev) => prev.filter((id) => id !== ue.id));

        console.log("Désaffectée !");
        }
      } else {
        // ✅ AFFECTATION
        await AffectationService.affecter(ue.id, selectedProf.id);

        setProfUes((prev) => [...prev, ue]);
        setSelectedUEs((prev) => [...prev, ue.id]);

        console.log("Affectée !");
      }
    } catch (error) {
      console.error("Erreur affectation/désaffectation :", error);
    }
  };

  const handleAddUE = () => {
    setShowUESelector(true);
  };

  // ✅ FILTRAGE PROF
  const profFiltered = professeurs.filter((prof) =>
    `${prof.utilisateur.first_name} ${prof.utilisateur.last_name}`
      .toLowerCase()
      .includes(searchProf.toLowerCase())
  );

  // ✅ FILTRAGE UE
  const ueFiltered = ues.filter((ue) =>
    ue.libelle.toLowerCase().includes(searchUE.toLowerCase())
  );

  return (
    <div className="p-6">

      <div className="grid grid-cols-2 gap-6">

        {/* ✅ COLONNE PROFESSEURS */}
        <div>
          <h3 className="font-semibold mb-2">Liste des professeurs</h3>

          {/* ✅ Filtre prof */}
          <input
            type="text"
            placeholder="Rechercher un professeur..."
            value={searchProf}
            onChange={(e) => setSearchProf(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />

          <table className="w-150 border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Nom</th>
                <th className="p-2">Prénom</th>
                <th className="p-2">Titre</th>
              </tr>
            </thead>
            <tbody>
              {profFiltered.map((prof) => (
                <tr
                  key={prof.id}
                  className={`cursor-pointer hover:bg-gray-100 ${
                    selectedProf?.id === prof.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => handleSelectProf(prof)}
                >
                  <td className="p-2">{prof.utilisateur.first_name}</td>
                  <td className="p-2">{prof.utilisateur.last_name}</td>
                  <td className="p-2">{prof.titre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ COLONNE UEs */}
        <div>
          {selectedProf ? (
            <>
              <h3 className="text-lg font-semibold mb-3">
                UEs de {selectedProf.utilisateur.last_name}
              </h3>

              <button
                onClick={handleAddUE}
                className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
              >
                ➕ Gérer les UE
              </button>

              {/* ✅ UEs actuelles */}
              {profUes.length > 0 ? (
                <ul className="list-disc ml-6 mb-4">
                  {profUes.map((ue) => (
                    <li key={ue.id}>{ue.libelle}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mb-4">Aucune UE affectée.</p>
              )}

              {showUESelector && (
                <div className="p-4 border rounded bg-gray-50">

                  {/* ✅ Filtre UE */}
                  <input
                    type="text"
                    placeholder="Rechercher une UE..."
                    value={searchUE}
                    onChange={(e) => setSearchUE(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                  />

                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-center">Choisir</th>
                        <th className="p-2">Nom UE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ueFiltered.map((ue) => {
                        const isChecked = profUes.some(
                          (pu) => pu.id === ue.id
                        );

                        return (
                          <tr key={ue.id}>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleUE(ue)}
                              />
                            </td>
                            <td className="p-2">{ue.libelle}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500">
              Sélectionnez un professeur.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
