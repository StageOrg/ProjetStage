import React, { useEffect, useState } from "react";
import { FaFileAlt, FaEdit, FaSave, FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import ArticleService from "@/services/articleService"

const initialArticles = [
  { id: 1, titre: "Optimisation des algorithmes", revue: "Revue Info Togo", annee: "2023", lien: "#" },
  { id: 2, titre: "Sécurité web", revue: "Journal IT Afrique", annee: "2022", lien: "#" },
];

export default function ArticlesPubliesProf() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const journal = "";
  
  // Gestion édition (id de l’article édité ou null si aucun)
  const [editingId, setEditingId] = useState(null);
  
  // Données en cours d’édition ou création
  const [editArticle, setEditArticle] = useState({ titre: "", revue: "", annee: "", lien: "" });
  
  // Mode ajout (booléen)
  const [adding, setAdding] = useState(false);

  // Filtrer les articles selon la recherche dans titre ou revue
  const filteredArticles = articles.filter(
    (a) =>
      a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.revue.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(()=>{
    ArticleService.getMesArticles()
      .then((data)=>{setArticles(data)})
      .catch((err)=>{console.error(err)});
  },[]);

  

  
  // Ouvrir le mode édition sur un article existant
  const handleEdit = (article) => {
    setEditingId(article.id);
    setEditArticle({ ...article }); // copier l’article pour l’éditer
    setAdding(false);
  };

  // Annuler ajout ou édition
  const handleCancel = () => {
    setEditingId(null);
    setAdding(false);
    setEditArticle({ titre: "", revue: "", annee: "", lien: "" });
  };

  // Sauvegarder les modifications ou ajout
  const handleSave = async () => {
    if (!editArticle.titre || !editArticle.revue || !editArticle.annee) {
      alert("Merci de remplir tous les champs (titre, revue, année).");
      return;
    }

    if (adding) {
      // Ajouter un nouvel article (id généré simple)
      const newArticle = {
        ...editArticle,
      };
      setArticles([...articles, newArticle]);
      const article = await ArticleService.create(newArticle.titre, journal, newArticle.annee, newArticle.lien);
    } else {
      // Modifier un article existant
      setArticles(
        articles.map((a) => (a.id === editingId ? { ...editArticle, id: editingId } : a))
      );
    }

    handleCancel(); // Fermer mode édition/ajout
  };

  // Supprimer un article par id
  const handleDelete = (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet article ?")) {
      setArticles(articles.filter((a) => a.id !== id));
    }
  };

  // Gérer les changements dans le formulaire d’édition/ajout
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditArticle((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-blue-900 mb-6">
        <FaFileAlt className="text-blue-700" /> Articles publiés
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
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
            setEditArticle({ titre: "", revue: "", annee: "", lien: "" });
          }}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
        >
          <FaPlus /> Ajouter un article
        </button>
      </div>

      {/* Formulaire ajout / modification */}
      {(adding || editingId !== null) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="mb-6 bg-white p-6 rounded shadow"
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="text"
              name="titre"
              placeholder="Titre"
              value={editArticle.titre}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            <input
              type="text"
              name="revue"
              placeholder="Revue"
              value={editArticle.revue}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            <input
              type="number"
              name="annee"
              placeholder="Année"
              value={editArticle.annee}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            <input
              type="url"
              name="lien"
              placeholder="Lien (URL)"
              value={editArticle.lien}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition flex items-center gap-2"
            >
              <FaSave /> {adding ? "Ajouter" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

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
