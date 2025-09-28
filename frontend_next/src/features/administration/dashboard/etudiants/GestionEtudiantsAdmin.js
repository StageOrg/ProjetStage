 import React from "react";
import { FaUserGraduate } from "react-icons/fa";

const etudiants = [
  { nom: "Ekoué", prenom: "Afi Sandrine", email: "afi.sandrine@epl.tg", annee: "Licence 3", statut: "Actif" },
  { nom: "Komi", prenom: "Kossi", email: "k.komi@epl.tg", annee: "Master 1", statut: "Inactif" },
];

export default function GestionEtudiantsAdmin() {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-4xl animate-fade-in">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-teal-900 mb-6">
        <FaUserGraduate className="text-teal-700" /> Gestion des étudiants
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left text-teal-800">
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Prénom</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Année</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {etudiants.map((e, idx) => (
              <tr key={idx} className="bg-white/70 hover:bg-teal-50 transition rounded-xl shadow">
                <td className="px-3 py-2 font-semibold text-teal-900">{e.nom}</td>
                <td className="px-3 py-2">{e.prenom}</td>
                <td className="px-3 py-2">{e.email}</td>
                <td className="px-3 py-2">{e.annee}</td>
                <td className={"px-3 py-2 font-bold " + (e.statut === "Actif" ? "text-green-700" : "text-red-600")}>{e.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

 