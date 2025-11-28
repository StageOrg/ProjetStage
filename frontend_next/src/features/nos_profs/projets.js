"use client";
import React, { useState, useEffect } from "react";
import { FaFileAlt } from "react-icons/fa";
import ProjetService from "@/services/projetService"; // À adapter selon ton service

export default function ProjetsPublic({ profId }) {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Charger les articles au montage
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await ProjetService.getProjetsByProfId(profId); // Méthode qui récupère tous les projets
      console.log("data",data);

      setArticles(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
      alert("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer articles par titre ou résumé
  const filteredArticles = articles.filter(
    (a) =>
      a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.resume.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
        <div className="text-center py-8">
          <div className="text-blue-900">Chargement des articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-flex items-center mb-6 gap-4">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-blue-900 mb-6">
        <FaFileAlt className="text-blue-700" /> Projets Publics
      </h2>

      {/* Filtre recherche */}
        <input
          type="text"
          placeholder="Rechercher par titre ou résumé"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      {/* Tableau articles */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left text-blue-900 bg-blue-100">
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Résumé</th>
              <th className="px-3 py-2">Lien</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  Aucun article trouvé.
                </td>
              </tr>
            ) : (
              filteredArticles.map(a => (
                <tr key={a.id} className="bg-white/70 hover:bg-blue-50 transition rounded-xl shadow">
                  <td className="px-3 py-2 font-semibold text-blue-900">{a.titre}</td>
                  <td className="px-3 py-2 max-w-xs">
                    <div className="truncate" title={a.resume}>
                      {a.resume}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {a.lien ? (
                      <a 
                        href={a.lien} 
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
