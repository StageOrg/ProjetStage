"use client";
import { useState } from "react";
import { PlusCircle, ChevronRight, ChevronDown } from "lucide-react";

export default function EtablissementGestion() {
  const [parcoursOuvert, setParcoursOuvert] = useState(null);
  const [filiereOuverte, setFiliereOuverte] = useState(null);
  const [anneeOuverte, setAnneeOuverte] = useState(null);

  // 🔹 Données statiques (à remplacer plus tard par API)
  const etablissement = {
    nom: "Université de Lomé - Faculté des Sciences",
    departements: [
      {
        nom: "Département de Mathématiques et Informatique",
        parcours: [
          {
            id: 1,
            libelle: "Informatique",
            filieres: [
              {
                id: 1,
                nom: "Génie Logiciel",
                annees: [
                  {
                    id: 1,
                    libelle: "1ère année",
                    semestres: ["Semestre 1", "Semestre 2"],
                  },
                  {
                    id: 2,
                    libelle: "2ème année",
                    semestres: ["Semestre 3", "Semestre 4"],
                  },
                ],
              },
              {
                id: 2,
                nom: "Réseaux et Télécoms",
                annees: [
                  {
                    id: 3,
                    libelle: "1ère année",
                    semestres: ["Semestre 1", "Semestre 2"],
                  },
                ],
              },
            ],
          },
          {
            id: 2,
            libelle: "Mathématiques",
            filieres: [],
          },
        ],
      },
    ],
  };

  const handleToggleParcours = (id) =>
    setParcoursOuvert(parcoursOuvert === id ? null : id);

  const handleToggleFiliere = (id) =>
    setFiliereOuverte(filiereOuverte === id ? null : id);

  const handleToggleAnnee = (id) =>
    setAnneeOuverte(anneeOuverte === id ? null : id);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-2xl">
      <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">
        {etablissement.nom}
      </h1>

      {etablissement.departements.map((dep, index) => (
        <div key={index} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {dep.nom}
          </h2>

          {/* Parcours */}
          <div className="space-y-2">
            {dep.parcours.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 bg-gray-50">
                <div
                  onClick={() => handleToggleParcours(p.id)}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <span className="font-medium">{p.libelle}</span>
                  <div className="flex items-center gap-2">
                    <PlusCircle className="text-blue-600 cursor-pointer" size={18} />
                    {parcoursOuvert === p.id ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </div>
                </div>

                {/* Filières */}
                {parcoursOuvert === p.id && (
                  <div className="ml-5 mt-3 space-y-2">
                    {p.filieres.map((f) => (
                      <div
                        key={f.id}
                        className="border-l-2 pl-3 py-2 cursor-pointer hover:bg-gray-100 rounded-md"
                      >
                        <div
                          onClick={() => handleToggleFiliere(f.id)}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-700">{f.nom}</span>
                          <div className="flex items-center gap-2">
                            <PlusCircle
                              className="text-green-600 cursor-pointer"
                              size={16}
                            />
                            {filiereOuverte === f.id ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </div>
                        </div>

                        {/* Années */}
                        {filiereOuverte === f.id && (
                          <div className="ml-5 mt-2 space-y-1">
                            {f.annees.map((a) => (
                              <div
                                key={a.id}
                                className="border-l pl-3 py-1 hover:bg-gray-50"
                              >
                                <div
                                  onClick={() => handleToggleAnnee(a.id)}
                                  className="flex justify-between items-center"
                                >
                                  <span>{a.libelle}</span>
                                  <div className="flex items-center gap-2">
                                    <PlusCircle
                                      className="text-purple-600 cursor-pointer"
                                      size={14}
                                    />
                                    {anneeOuverte === a.id ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                  </div>
                                </div>

                                {/* Semestres */}
                                {anneeOuverte === a.id && (
                                  <ul className="ml-4 mt-2 list-disc text-sm text-gray-600">
                                    {a.semestres.map((s, i) => (
                                      <li key={i} className="flex items-center">
                                        {s}
                                        <PlusCircle
                                          className="ml-2 text-orange-500 cursor-pointer"
                                          size={12}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bouton pour ajouter un parcours */}
            <div className="mt-3 flex items-center gap-2 text-blue-600 cursor-pointer">
              <PlusCircle size={18} />
              <span>Ajouter un parcours</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
