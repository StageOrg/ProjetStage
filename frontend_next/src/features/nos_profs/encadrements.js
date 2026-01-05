"use client";
import React, { useState, useEffect } from "react";
import { FaUsers } from "react-icons/fa";
import EncadrementService from "@/services/encadrementService"; 
import ProfInfos from "@/features/util/profInfos";
export default  function EncadrementsPublic({ profId }) {
  const [encadrements, setEncadrements] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Charger les encadrements au montage
  useEffect(() => {
    loadEncadrements();
  }, []);

  const loadEncadrements = async () => {
    try {
      setLoading(true);
      const data = await EncadrementService.getEncadrementsByProfId(profId); // Méthode publique pour récupérer tous les encadrements
      setEncadrements(data);
    } catch (error) {
      console.error("Erreur lors du chargement des encadrements:", error);
      alert("Erreur lors du chargement des encadrements");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer selon étudiant ou titre
  const filteredEncadrements = encadrements.filter(
    (e) =>
      e.nom_etudiant.toLowerCase().includes(search.toLowerCase()) ||
      e.titre.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
        <div className="text-center py-8">
          <div className="text-blue-900">Chargement des encadrements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-blue-900 mb-6">
        <FaUsers className="text-blue-700" /> Encadrements du <ProfInfos profId={profId} />
      </h2>

      {/* Filtre recherche */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Rechercher par étudiant ou titre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      {/* Tableau encadrements */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left text-blue-900 bg-blue-100">
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Titre/Sujet</th>
              <th className="px-3 py-2">Étudiant</th>
              <th className="px-3 py-2">Niveau</th>
              <th className="px-3 py-2">Filière</th>
              <th className="px-3 py-2">Année</th>
              <th className="px-3 py-2">Lien</th>
            </tr>
          </thead>
          <tbody>
            {filteredEncadrements.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  Aucun encadrement trouvé.
                </td>
              </tr>
            ) : (
              filteredEncadrements.map((e) => (
                <tr key={e.id} className="bg-white/70 hover:bg-blue-50 transition rounded-xl shadow">
                  <td className="px-3 py-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {e.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-blue-900 max-w-xs">
                    <div className="truncate" title={e.titre}>
                      {e.titre}
                    </div>
                  </td>
                  <td className="px-3 py-2">{e.nom_etudiant}</td>
                  <td className="px-3 py-2">{e.niveau}</td>
                  <td className="px-3 py-2">{e.filiere}</td>
                  <td className="px-3 py-2">{e.annee}</td>
                  <td className="px-3 py-2">
                    {e.lien ? (
                      <a 
                        href={e.lien} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Voir
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
