"use client";

import React, { useState } from "react";

export default function Formulaire({ champs, onSubmit }) {
  const [valeurs, setValeurs] = useState({});
  const [erreurs, setErreurs] = useState({});

  const handleChange = (e, nom) => {
    setValeurs({ ...valeurs, [nom]: e.target.value });
    setErreurs({ ...erreurs, [nom]: "" });
  };

  const valider = () => {
    let erreursTemp = {};
    champs.forEach((champ) => {
      const val = valeurs[champ.nom] || "";
      if (champ.requis && !val.trim()) {
        erreursTemp[champ.nom] = "Ce champ est requis.";
      } 
      if (champ.onlyGmail && !/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val)) {
        erreursTemp[champ.nom] = "Seules les adresses Gmail sont autorisées.";
      }

    });
    return erreursTemp;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = valider();
    if (Object.keys(validation).length === 0) {
      onSubmit(valeurs);
    } else {
      setErreurs(validation);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {champs.map((champ) => (
        <div key={champ.nom}>
          <label className="block text-black font-semibold mb-2">{champ.label}</label>
          <input
            type={champ.type || "text"}
            value={valeurs[champ.nom] || ""}
            onChange={(e) => handleChange(e, champ.nom)}
            className={`w-full px-4 py-2 rounded-lg border ${
              erreurs[champ.nom] ? "border-red-500" : "border-gray-200"
            } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/70`}
            placeholder={champ.placeholder}
          />
          {erreurs[champ.nom] && <p className="text-red-500 text-sm mt-1">{erreurs[champ.nom]}</p>}
        </div>
      ))}
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-full shadow transition-all mt-2"
      >
        Soumettre
      </button>
    </form>
  );
}
