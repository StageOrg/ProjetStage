"use client";
import React, { useState, useEffect } from "react";
import {FaSearch,FaFileExport,FaArrowLeft,FaArrowRight,FaSync,FaEdit,FaTrash,} from "react-icons/fa";
import * as XLSX from "xlsx";
import etudiantService from "@/services/etudiants/etudiantService";

export default function GestionEtudiantsAdmin() {
  
  const [etudiants, setEtudiants] = useState([]);
  const [parcoursData, setParcoursData] = useState([]); //  Parcours avec relations
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",parcours: "",filiere: "",annee_etude: "",page: 1,page_size: 10,
  });

  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
  });

  //  États pour filtres dépendants
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);

  useEffect(() => {
    chargerParcoursAvecRelations();
  }, []);

  const chargerParcoursAvecRelations = async () => {
    try {
      console.log("Chargement parcours...");
      const parcours = await etudiantService.getParcoursAvecRelations();
      setParcoursData(parcours);
      console.log(" Parcours chargés:", parcours);
    } catch (err) {
      console.error(" Erreur parcours:", err);
    }
  };

  useEffect(() => {
    if (!filters.parcours) {
      // Aucun parcours sélectionné → vider les filtres dépendants
      setFilieresDuParcours([]);
      setAnneesDuParcours([]);
      setFilters(prev => ({ ...prev, filiere: "", annee_etude: "" }));
      return;
    }

    // Trouver le parcours sélectionné
    const parcoursTrouve = parcoursData.find(
      p => p.id.toString() === filters.parcours.toString()
    );

    if (parcoursTrouve) {
      console.log(" Parcours sélectionné:", parcoursTrouve);
      
      // Mettre à jour les options des filtres dépendants
      setFilieresDuParcours(parcoursTrouve.filieres || []);
      setAnneesDuParcours(parcoursTrouve.annees_etude || []);
      
      // Réinitialiser les filtres si les valeurs actuelles ne sont plus valides
      const filiereValide = parcoursTrouve.filieres?.some(f => f.id.toString() === filters.filiere);
      const anneeValide = parcoursTrouve.annees_etude?.some(a => a.id.toString() === filters.annee_etude);
      
      if (!filiereValide) setFilters(prev => ({ ...prev, filiere: "" }));
      if (!anneeValide) setFilters(prev => ({ ...prev, annee_etude: "" }));
    }
  }, [filters.parcours, parcoursData]);

  const chargerEtudiants = async () => {
    try {
      setLoading(true);
      console.log("Chargement étudiants :", filters);
      const data = await etudiantService.getAllEtudiants(filters);
      setEtudiants(data.results || []);
      setPagination({
        count: data.count || 0,
        total_pages: data.total_pages || 1,
      });
      
      console.log("Étudiants chargés:", data.results?.length || 0);
    } catch (error) {
      console.error(" Erreur chargement étudiants:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Rechargement automatique quand les filtres changent
  useEffect(() => {
    const timer = setTimeout(() => {
      chargerEtudiants();
    }, 300); // Debounce 100ms pour la recherche

    return () => clearTimeout(timer);
  }, [filters]);

  // -------------------------------
  // HANDLERS SIMPLES
  // -------------------------------
  const changerFiltre = (cle, valeur) => {
    console.log(`🔧 Filtre ${cle} = ${valeur}`);
    setFilters(prev => ({ 
      ...prev, 
      [cle]: valeur, 
      page: 1 // Toujours revenir à la page 1
    }));
  };

  const viderFiltres = () => {
    setFilters({
      search: "",
      parcours: "",
      filiere: "",
      annee_etude: "",
      page: 1,
      page_size: 10,
    });
  };

  // -------------------------------
  // EXPORT FUNCTIONS
  // -------------------------------
  const exporterExcel = () => {
    try {
      const donnees = etudiants.map(e => ({
        "Num Carte": e.num_carte || '',
        "Nom": e.utilisateur?.last_name || '',
        "Prénom": e.utilisateur?.first_name || '',
        "Email": e.utilisateur?.email || '',
        "Téléphone": e.utilisateur?.telephone || '',
        "Date Naissance": e.date_naiss || '',
        "Lieu Naissance": e.lieu_naiss || '',
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(donnees);
      XLSX.utils.book_append_sheet(wb, ws, "Étudiants");
      XLSX.writeFile(wb, `etudiants_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log("✅ Export Excel réussi");
    } catch (err) {
      console.error("❌ Erreur export Excel:", err);
      alert("Erreur lors de l'export Excel");
    }
  };

  // -------------------------------
  // CRUD
  // -------------------------------
  const supprimerEtudiant = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;

    try {
      await etudiantService.deleteEtudiant(id);
      alert("Étudiant supprimé avec succès !");
      chargerEtudiants();
    } catch (err) {
      console.error("❌ Erreur suppression:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // -------------------------------
  // RENDER SIMPLE
  // -------------------------------
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-4">Gestion des Étudiants</h2>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          {/* Recherche */}
          <div className="flex items-center border rounded-lg p-2 bg-gray-50">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => changerFiltre("search", e.target.value)}
              className="outline-none bg-transparent"
            />
          </div>

          {/* ✅ Parcours */}
          <select
            value={filters.parcours}
            onChange={(e) => changerFiltre("parcours", e.target.value)}
            className="border p-2 rounded-lg"
          >
            <option value="">-- Tous les parcours --</option>
            {parcoursData.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </select>

          {/* ✅ Filières (dépendant du parcours) */}
          <select
            value={filters.filiere}
            onChange={(e) => changerFiltre("filiere", e.target.value)}
            className="border p-2 rounded-lg"
            disabled={!filters.parcours}
          >
            <option value="">-- Toutes les filières --</option>
            {filieresDuParcours.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>

          {/* ✅ Années (dépendant du parcours) */}
          <select
            value={filters.annee_etude}
            onChange={(e) => changerFiltre("annee_etude", e.target.value)}
            className="border p-2 rounded-lg"
            disabled={!filters.parcours}
          >
            <option value="">-- Toutes les années --</option>
            {anneesDuParcours.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>

          {/* Actions */}
          <button
            onClick={exporterExcel}
            disabled={etudiants.length === 0}
            className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 disabled:opacity-50"
          >
            <FaFileExport className="mr-2" /> Excel
          </button>

          <button
            onClick={viderFiltres}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Vider filtres
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-600">
        {pagination.count > 0 ? (
          `${pagination.count} étudiant${pagination.count > 1 ? 's' : ''} trouvé${pagination.count > 1 ? 's' : ''}`
        ) : (
          'Aucun étudiant trouvé'
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-8 text-center">
            <FaSync className="animate-spin mx-auto mb-4 text-2xl text-blue-500" />
            <p>Chargement...</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Num Carte</th>
                <th className="p-3 text-left">Nom</th>
                <th className="p-3 text-left">Prénom</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Téléphone</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.length > 0 ? (
                etudiants.map((etudiant, index) => (
                  <tr key={etudiant.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{(filters.page - 1) * filters.page_size + index + 1}</td>
                    <td className="p-3">{etudiant.num_carte || '-'}</td>
                    <td className="p-3">{etudiant.utilisateur?.last_name || '-'}</td>
                    <td className="p-3">{etudiant.utilisateur?.first_name || '-'}</td>
                    <td className="p-3">{etudiant.utilisateur?.email || '-'}</td>
                    <td className="p-3">{etudiant.utilisateur?.telephone || '-'}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => alert(`Modifier ${etudiant.utilisateur?.first_name}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => supprimerEtudiant(etudiant.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    Aucun étudiant trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={filters.page <= 1}
          onClick={() => changerFiltre("page", filters.page - 1)}
          className="flex items-center px-3 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          <FaArrowLeft className="mr-1" /> Précédent
        </button>

        <span>Page {filters.page} / {pagination.total_pages}</span>

        <button
          disabled={filters.page >= pagination.total_pages}
          onClick={() => changerFiltre("page", filters.page + 1)}
          className="flex items-center px-3 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
        >
          Suivant <FaArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
}