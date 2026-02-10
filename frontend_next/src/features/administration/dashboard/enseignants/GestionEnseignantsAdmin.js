
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import ProfesseurService from "@/services/profService";

export default function GestionEnseignants() {
  const [professeurs, setProfesseurs] = useState([]);
  const [filterNom, setFilterNom] = useState("");
  const [filterTitre, setFilterTitre] = useState("");
  const router = useRouter();

  useEffect(() => {
    ProfesseurService.getAllProfesseurs()
      .then((data) => setProfesseurs(data))
      .catch((err) => console.error(err));
  }, []);


  const filtered = professeurs?.filter(
    (e) =>
      e.utilisateur.first_name.toLowerCase().includes(filterNom.toLowerCase()) &&
      e.titre.toLowerCase().includes(filterTitre.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 space-y-8  text-black">
      
      {/* Barre supérieure avec bouton + filtres */}
      <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* Filtres */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 w-full md:w-auto">
          <div className="flex items-center border rounded-lg px-3 w-full md:w-64">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer par nom"
              value={filterNom}
              onChange={(e) => setFilterNom(e.target.value)}
              className="flex-1 px-2 py-2 outline-none"
            />
          </div>

          <div className="flex items-center border rounded-lg px-3 w-full md:w-64">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer par titre"
              value={filterTitre}
              onChange={(e) => setFilterTitre(e.target.value)}
              className="flex-1 px-2 py-2 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tableau en dessous */}
      <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Prénom</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Téléphone</th>
              <th className="p-3 text-left">Titre</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((e, idx) => (
              <tr key={idx} className="border-b hover:bg-blue-50 transition">
                <td className="p-3 font-semibold text-gray-800">{e.utilisateur.first_name.toUpperCase()}</td>
                <td className="p-3">{e.utilisateur.last_name.toLowerCase()}</td>
                <td className="p-3 text-blue-600">{e.utilisateur.email}</td>
                <td className="p-3">{e.utilisateur.telephone || "-"}</td>
                <td className="p-3">{e.titre}</td>
              </tr>
            ))}
            {(filtered || []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Aucun enseignant trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
