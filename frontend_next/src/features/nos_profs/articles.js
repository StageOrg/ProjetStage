import React, { useEffect, useState } from "react";
import ArticleService from "@/services/articleService"
import ProfInfos from "@/features/util/profInfos";

export default function ArticlesPublic(profId) {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");

  // Filtrer les articles selon la recherche dans titre ou revue
  const filteredArticles = articles.filter(
    (a) =>
      a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.revue.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(()=>{
    ArticleService.getArticleByProfId(profId)
      .then((data)=>{setArticles(data)})
      .catch((err)=>{console.error(err)});
  },[]);


  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-blue-900 mb-6">
        <FaFileAlt className="text-blue-700" /> Articles publiés par <ProfInfos profId={profId} />
      </h2>

      {/* Barre recherche + bouton ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Rechercher par titre ou revue"
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
              <th className="px-3 py-2">Revue</th>
              <th className="px-3 py-2">Année</th>
              <th className="px-3 py-2">Lien</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Aucun article trouvé.
                </td>
              </tr>
            ) : (
              filteredArticles.map((a) => (
                <tr
                  key={a.id}
                  className="bg-white/70 hover:bg-blue-50 transition rounded-xl shadow"
                >
                  <td className="px-3 py-2 font-semibold text-blue-900">{a.titre}</td>
                  <td className="px-3 py-2">{a.revue}</td>
                  <td className="px-3 py-2">{a.annee}</td>
                  <td className="px-3 py-2">
                    {a.lien ? (
                      <a
                        href={a.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline hover:text-blue-900"
                      >
                        Voir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 flex gap-3">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
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
