import React, { useState, useEffect } from "react";
import { FaUsers, FaEdit, FaSave, FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import EncadrementService from "@/services/encadrementService";

export default function EncadrementsProf() {
  const [encadrements, setEncadrements] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editEncadrement, setEditEncadrement] = useState({ 
    type: "", 
    titre: "", 
    niveau: "", 
    filiere: "", 
    nom_etudiant: "", 
    annee: "", 
    lien: "" 
  });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger les encadrements au montage du composant
  useEffect(() => {
    loadEncadrements();
  }, []);

  const loadEncadrements = async () => {
    try {
      setLoading(true);
      const data = await EncadrementService.getMesEncadrements();
      setEncadrements(data);
    } catch (error) {
      console.error("Erreur lors du chargement des encadrements:", error);
      alert("Erreur lors du chargement des encadrements");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer selon étudiant ou titre
  const filteredEncadrements = encadrements?.filter(
    (e) =>
      e.nom_etudiant.toLowerCase().includes(search.toLowerCase()) ||
      e.titre.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (encadrement) => {
    setEditingId(encadrement.id);
    setEditEncadrement({ 
      type: encadrement.type,
      titre: encadrement.titre,
      niveau: encadrement.niveau,
      filiere: encadrement.filiere,
      nom_etudiant: encadrement.nom_etudiant,
      annee: encadrement.annee,
      lien: encadrement.lien || ""
    });
    setAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAdding(false);
    setEditEncadrement({ 
      type: "", 
      titre: "", 
      niveau: "", 
      filiere: "", 
      nom_etudiant: "", 
      annee: "", 
      lien: "" 
    });
  };

  const handleSave = async () => {
    if (!editEncadrement.type || !editEncadrement.titre || !editEncadrement.niveau || 
        !editEncadrement.filiere || !editEncadrement.nom_etudiant || !editEncadrement.annee) {
      alert("Merci de remplir tous les champs obligatoires.");
      return;
    }
    try {
      setSubmitting(true);
      
      if (adding) {
        // Créer un nouvel encadrement
        const newEncadrement = await EncadrementService.create(
          editEncadrement.type,
          editEncadrement.titre,
          editEncadrement.niveau,
          editEncadrement.filiere,
          editEncadrement.nom_etudiant,
          editEncadrement.annee,
          editEncadrement.lien
        );
        setEncadrements([...encadrements, newEncadrement]);
      } else {
        // Mettre à jour un encadrement existant
        const updatedEncadrement = await EncadrementService.update(
          editingId,
          editEncadrement.type,
          editEncadrement.titre,
          editEncadrement.niveau,
          editEncadrement.filiere,
          editEncadrement.nom_etudiant,
          editEncadrement.annee,
          editEncadrement.lien
        );
        setEncadrements(encadrements.map(e => (e.id === editingId ? updatedEncadrement : e)));
      }
      
      handleCancel();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde de l'encadrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet encadrement ?")) {
      try {
        await EncadrementService.delete(id);
        setEncadrements(encadrements.filter(e => e.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'encadrement");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditEncadrement(prev => ({ ...prev, [name]: value }));
  };

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
        <FaUsers className="text-blue-700" /> Encadrements
      </h2>

      {/* Recherche + bouton ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Rechercher par étudiant ou titre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
        <button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
            setEditEncadrement({ 
              type: "", 
              titre: "", 
              niveau: "", 
              filiere: "", 
              nom_etudiant: "", 
              annee: "", 
              lien: "" 
            });
          }}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition"
        >
          <FaPlus /> Ajouter un encadrement
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <select
              name="type"
              value={editEncadrement.type}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            >
              <option value="">Type d'encadrement *</option>
              <option value="Stage">Stage</option>
              <option value="Mémoire">Mémoire</option>
              <option value="Projet">Projet</option>
              <option value="Thèse">Thèse</option>
              <option value="Autre">Autre</option>
            </select>
            
            <input
              type="text"
              name="titre"
              placeholder="Titre/Sujet *"
              value={editEncadrement.titre}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            
            <select
              name="niveau"
              value={editEncadrement.niveau}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            >
              <option value="">Niveau *</option>
              <option value="Licence 1">Licence 1</option>
              <option value="Licence 2">Licence 2</option>
              <option value="Licence 3">Licence 3</option>
              <option value="Master 1">Master 1</option>
              <option value="Master 2">Master 2</option>
              <option value="Doctorat">Doctorat</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              name="filiere"
              placeholder="Filière *"
              value={editEncadrement.filiere}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            
            <input
              type="text"
              name="nom_etudiant"
              placeholder="Nom de l'étudiant *"
              value={editEncadrement.nom_etudiant}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
            
            <input
              type="text"
              name="annee"
              placeholder="Année (ex: 2023-2024) *"
              value={editEncadrement.annee}
              onChange={handleChange}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="url"
              name="lien"
              placeholder="Lien vers document/projet (optionnel)"
              value={editEncadrement.lien}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEncadrements?.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  Aucun encadrement trouvé.
                </td>
              </tr>
            ) : (
              filteredEncadrements?.map((e) => (
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
                  <td className="px-3 py-2 flex gap-3">
                    <button
                      onClick={() => handleEdit(e)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Modifier"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
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