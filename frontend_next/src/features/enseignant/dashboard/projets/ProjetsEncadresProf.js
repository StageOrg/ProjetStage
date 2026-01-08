"use client";
import React, { useState, useEffect } from "react";
import { FaProjectDiagram, FaEdit, FaSave, FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import ProjetService from "@/services/projetService";

export default function ProjetsEncadresProf() {
  const [projets, setProjets] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editProjet, setEditProjet] = useState({ 
    titre: "", 
    date_debut: "", 
    date_fin: "", 
    resume: "", 
    lien: "" 
  });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les projets au montage du composant
  useEffect(() => {
    loadProjets();
  }, []);

  const loadProjets = async () => {
    try {
      setLoading(true);
      const data = await ProjetService.getMesProjets();
      setProjets(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
      alert("Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer projets par titre ou resume
  const filteredProjets = projets?.filter(
    (p) =>
      p.titre.toLowerCase().includes(search.toLowerCase()) ||
      p.resume.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (projet) => {
    setEditingId(projet.id);
    setEditProjet({ 
      titre: projet.titre,
      date_debut: projet.date_debut,
      date_fin: projet.date_fin,
      resume: projet.resume,
      lien: projet.lien || ""
    });
    setAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAdding(false);
    setEditProjet({ 
      titre: "", 
      date_debut: "", 
      date_fin: "", 
      resume: "", 
      lien: "" 
    });
  };

  const handleSave = async () => {
    if (!editProjet.titre || !editProjet.date_debut || !editProjet.date_fin || !editProjet.resume) {
      alert("Merci de remplir tous les champs obligatoires (titre, dates, résumé).");
      return;
    }

    try {
      setSubmitting(true);
      
      if (adding) {
        // Créer un nouveau projet
        const newProjet = await ProjetService.create(
          editProjet.titre,
          editProjet.date_debut,
          editProjet.date_fin,
          editProjet.resume,
          editProjet.lien
        );
        setProjets([...projets, newProjet]);
      } else {
        // Mettre à jour un projet existant
        const updatedProjet = await ProjetService.update(
          editingId,
          editProjet.titre,
          editProjet.date_debut,
          editProjet.date_fin,
          editProjet.resume,
          editProjet.lien
        );
        setProjets(projets.map(p => (p.id === editingId ? updatedProjet : p)));
      }
      
      handleCancel();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde du projet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce projet ?")) {
      try {
        await ProjetService.delete(id);
        setProjets(projets.filter(p => p.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression du projet");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditProjet(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
        <div className="text-center py-8">
          <div className="text-blue-900">Chargement des projets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in max-w-5xl mx-auto">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-blue-900 mb-6">
        <FaProjectDiagram className="text-blue-700" /> Projets encadrés
      </h2>

      {/* Recherche + bouton ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Rechercher par titre ou résumé"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
            setEditProjet({ 
              titre: "", 
              date_debut: "", 
              date_fin: "", 
              resume: "", 
              lien: "" 
            });
          }}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
        >
          <FaPlus /> Ajouter un projet
        </button>
      </div>

      {/* Formulaire ajout / édition */}
      {(adding || editingId !== null) && (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="mb-6 bg-white p-6 rounded shadow"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="titre"
              placeholder="Titre du projet *"
              value={editProjet.titre}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            <input
              type="url"
              name="lien"
              placeholder="Lien*"
              value={editProjet.lien}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début *
              </label>
              <input
                type="date"
                name="date_debut"
                value={editProjet.date_debut}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin *
              </label>
              <input
                type="date"
                name="date_fin"
                value={editProjet.date_fin}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Résumé du projet *
            </label>
            <textarea
              name="resume"
              placeholder="Décrivez le projet..."
              value={editProjet.resume}
              onChange={handleChange}
              rows="4"
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaSave /> {submitting ? "Sauvegarde..." : (adding ? "Ajouter" : "Enregistrer")}
            </button>
          </div>
        </form>
      )}

      {/* Tableau projets */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left text-blue-900 bg-blue-100">
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Période</th>
              <th className="px-3 py-2">Résumé</th>
              <th className="px-3 py-2">Lien</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjets?.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Aucun projet trouvé.
                </td>
              </tr>
            ) : (
              filteredProjets?.map(p => (
                <tr key={p.id} className="bg-white/70 hover:bg-blue-50 transition rounded-xl shadow">
                  <td className="px-3 py-2 font-semibold text-blue-900">{p.titre}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm">
                      <div>Du: {new Date(p.date_debut).toLocaleDateString('fr-FR')}</div>
                      <div>Au: {new Date(p.date_fin).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </td>
                 <td className="px-3 py-2 max-w-sm">
                    <p className="line-clamp-3 text-gray-700 leading-relaxed" title={p.resume}>
                      {p.resume}
                    </p>
                  </td>

                  <td className="px-3 py-2">
                    {p.lien ? (
                      <a 
                        href={p.lien} 
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
                  <td className="px-3 py-2 flex gap-3">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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