"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaFileExport, FaSync, FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";


export default function GestionEtudiantsAdmin() {
  const [etudiants, setEtudiants] = useState([]);
  const [parcoursData, setParcoursData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    parcours: "1", // Par défaut pour tester avec vos inscriptions
    filiere: "2",
    annee_etude: "1",
  });

  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);

  useEffect(() => {
    chargerParcoursAvecRelations();
  }, []);

  const chargerParcoursAvecRelations = async () => {
    try {
      const parcours = await etudiantService.getParcoursAvecRelations();
      setParcoursData(parcours);
    } catch (err) {
      console.error("Erreur parcours:", err);
    }
  };

  useEffect(() => {
    if (!filters.parcours) {
      setFilieresDuParcours([]);
      setAnneesDuParcours([]);
      setFilters(prev => ({ ...prev, filiere: "", annee_etude: "" }));
      return;
    }

    const parcoursTrouve = parcoursData.find(
      p => p.id.toString() === filters.parcours.toString()
    );

    if (parcoursTrouve) {
      setFilieresDuParcours(parcoursTrouve.filieres || []);
      setAnneesDuParcours(parcoursTrouve.annees_etude || []);

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
      const data = await etudiantService.getAllEtudiants(filters); // Pas de pagination
      console.log("Données normalisées reçues :", data);
      setEtudiants(data.results || []);
      console.log("Étudiants chargés:", data.results?.length || 0);
      // Débogage : structure de chaque étudiant
      data.results.forEach((etudiant, index) => {
        console.log(`Étudiant ${index + 1}:`, etudiant);
      });
    } catch (error) {
      console.error("Erreur chargement étudiants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      chargerEtudiants();
    }, 100);
    return () => clearTimeout(timer);
  }, [filters]);

  const changerFiltre = (cle, valeur) => {
    console.log(`Filtre ${cle} = ${valeur}`);
    setFilters(prev => ({ ...prev, [cle]: valeur }));
  };

  const exporterExcel = () => {
    try {
      const donnees = etudiants.map(e => ({
        "Num Carte": e.num_carte || '',
        "Nom": e.utilisateur?.last_name || e.last_name || '',
        "Prénom": e.utilisateur?.first_name || e.first_name || '',
        "Email": e.utilisateur?.email || e.email || '',
        "Téléphone": e.utilisateur?.telephone || e.telephone || '',
        "Date Naissance": e.date_naiss || '',
        "Lieu Naissance": e.lieu_naiss || '',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(donnees);
      XLSX.utils.book_append_sheet(wb, ws, "Étudiants");
      XLSX.writeFile(wb, `etudiants_${new Date().toISOString().split('T')[0]}.xlsx`);
      console.log("Export Excel réussi");
    } catch (err) {
      console.error("Erreur export Excel:", err);
      alert("Erreur lors de l'export Excel");
    }
  };

  const supprimerEtudiant = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;
    try {
      await etudiantService.deleteEtudiant(id);
      alert("Étudiant supprimé avec succès !");
      chargerEtudiants();
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // Fonction utilitaire pour afficher les noms (fallback si utilisateur n'est pas imbriqué)
  const getNom = (etudiant) => etudiant.utilisateur?.last_name || etudiant.last_name || '';
  const getPrenom = (etudiant) => etudiant.utilisateur?.first_name || etudiant.first_name || '';
  const getEmail = (etudiant) => etudiant.utilisateur?.email || etudiant.email || '';
  const getTelephone = (etudiant) => etudiant.utilisateur?.telephone || etudiant.telephone || '';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-black">Gestion des Étudiants</h2>
      <div className="bg-white p-4 rounded-lg shadow mb-6  text-black">
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center border rounded-lg p-2 bg-gray-50">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => changerFiltre("search", e.target.value)}
              className="outline-none bg-transparent text-black"
            />
          </div>
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
          <select
            value={filters.filiere}
            onChange={(e) => changerFiltre("filiere", e.target.value)}
            className="border p-2 rounded-lg text-black"
            disabled={!filters.parcours}
          >
            <option value="">-- Toutes les filières --</option>
            {filieresDuParcours.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
          <select
            value={filters.annee_etude}
            onChange={(e) => changerFiltre("annee_etude", e.target.value)}
            className="border p-2 rounded-lg  text-black"
            disabled={!filters.parcours}
          >
            <option value="">-- Toutes les années --</option>
            {anneesDuParcours.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}
              </option>
            ))}
          </select>
          <button
            onClick={exporterExcel}
            disabled={etudiants.length === 0}
            className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 disabled:opacity-50"
          >
            <FaFileExport className="mr-2" /> Excel
          </button>

        </div>
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {etudiants.length > 0 ? (
          `${etudiants.length} étudiant${etudiants.length > 1 ? 's' : ''} trouvé${etudiants.length > 1 ? 's' : ''}`
        ) : (
          'Aucun étudiant trouvé'
        )}
      </div>
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
                    <td className="p-3  text-black">{index + 1}</td>
                    <td className="p-3  text-black">{etudiant.num_carte || '-'}</td>
                    <td className="p-3  text-black">{getNom(etudiant)}</td>
                    <td className="p-3  text-black">{getPrenom(etudiant)}</td>
                    <td className="p-3 text-black">{getEmail(etudiant)}</td>
                    <td className="p-3 text-black">{getTelephone(etudiant)}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => alert(`Modifier ${getPrenom(etudiant)} ${getNom(etudiant)}`)}
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
    </div>
  );
}

 