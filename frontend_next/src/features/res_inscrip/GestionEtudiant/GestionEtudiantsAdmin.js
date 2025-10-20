// frontend_next/src/pages/res_inscrip/modification/EditStudent.js
"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaFileExport, FaSync, FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import EditStudentModal from "@/features/res_inscrip/modificationEtudiant/EditStudent";

export default function GestionEtudiantsAdmin() {
  const [etudiants, setEtudiants] = useState([]);
  const [parcoursData, setParcoursData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // État pour la modale
  const [selectedStudent, setSelectedStudent] = useState(null); // Étudiant sélectionné pour modification

  const [filters, setFilters] = useState({
    search: "",
    parcours: "2",
    filiere: "1",
    annee_etude: "1",
  });

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
      console.log("Parcours chargés:", parcours);
    } catch (err) {
      console.error("Erreur parcours:", err);
    }
  };

  useEffect(() => {
    if (!filters.parcours) {
      setFilieresDuParcours([]);
      setAnneesDuParcours([]);
      setFilters((prev) => ({ ...prev, filiere: "", annee_etude: "" }));
      return;
    }

    const parcoursTrouve = parcoursData.find(
      (p) => p.id.toString() === filters.parcours.toString()
    );

    if (parcoursTrouve) {
      console.log("Parcours sélectionné:", parcoursTrouve);
      setFilieresDuParcours(parcoursTrouve.filieres || []);
      setAnneesDuParcours(parcoursTrouve.annees_etude || []);

      const filiereValide = parcoursTrouve.filieres?.some(
        (f) => f.id.toString() === filters.filiere
      );
      const anneeValide = parcoursTrouve.annees_etude?.some(
        (a) => a.id.toString() === filters.annee_etude
      );

      if (!filiereValide) setFilters((prev) => ({ ...prev, filiere: "" }));
      if (!anneeValide) setFilters((prev) => ({ ...prev, annee_etude: "" }));
    }
  }, [filters.parcours, parcoursData]);

  const chargerEtudiants = async () => {
    try {
      setLoading(true);
      console.log("Chargement étudiants :", filters);
      const data = await etudiantService.getAllEtudiants(filters);
      console.log("Données normalisées reçues :", data);
      setEtudiants(data.results || []);
      console.log("Étudiants chargés:", data.results?.length || 0);
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
    setFilters((prev) => ({ ...prev, [cle]: valeur }));
  };

  const exporterExcel = () => {
    try {
      const donnees = etudiants.map((e) => ({
        "Num Carte": e.num_carte || "",
        Nom: e.utilisateur?.last_name || e.last_name || "",
        Prénom: e.utilisateur?.first_name || e.first_name || "",
        Email: e.utilisateur?.email || e.email || "",
        Téléphone: e.utilisateur?.telephone || e.telephone || "",
        "Date Naissance": e.date_naiss || "",
        "Lieu Naissance": e.lieu_naiss || "",
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(donnees);
      XLSX.utils.book_append_sheet(wb, ws, "Étudiants");
      XLSX.writeFile(wb, `etudiants_${new Date().toISOString().split("T")[0]}.xlsx`);
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

  const ouvrirModaleModification = (etudiant) => {
    setSelectedStudent(etudiant);
    setModalOpen(true);
  };

  const fermerModale = () => {
    setModalOpen(false);
    setSelectedStudent(null);
  };

  const sauvegarderEtudiant = async (id, data) => {
    try {
      await etudiantService.updateEtudiant(id, data);
      alert("Étudiant mis à jour avec succès !");
      chargerEtudiants();
    } catch (err) {
      console.error("Erreur mise à jour étudiant:", err);
      throw err;
    }
  };

  const getNom = (etudiant) => etudiant.utilisateur?.last_name || etudiant.last_name || "";
  const getPrenom = (etudiant) => etudiant.utilisateur?.first_name || etudiant.first_name || "";
  const getEmail = (etudiant) => etudiant.utilisateur?.email || etudiant.email || "";
  const getTelephone = (etudiant) => etudiant.utilisateur?.telephone || etudiant.telephone || "";

  return (
    <div className="p-6 bg-black min-h-screen text-white"> 
      <h2 className="text-2xl font-bold mb-4 text-white">Gestion des Étudiants</h2>
      <div className="bg-gray-800 p-4 rounded-lg shadow mb-6"> 
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center border border-gray-600 rounded-lg p-2 bg-gray-900"> 
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => changerFiltre("search", e.target.value)}
              className="outline-none bg-transparent text-white placeholder-gray-400"
            />
          </div>
          <select
            value={filters.parcours}
            onChange={(e) => changerFiltre("parcours", e.target.value)}
            className="border border-gray-600 p-2 rounded-lg bg-gray-900 text-white" 
          >
            <option value="" className="bg-gray-900 text-black">-- Tous les parcours --</option>
            {parcoursData.map((p) => (
              <option key={p.id} value={p.id} className="bg-gray-900 text-black">
                {p.libelle}
              </option>
            ))}
          </select>
          <select
            value={filters.filiere}
            onChange={(e) => changerFiltre("filiere", e.target.value)}
            className="border border-gray-600 p-2 rounded-lg bg-gray-900 text-white disabled:bg-gray-700" 
            disabled={!filters.parcours}
          >
            <option value="" className="bg-gray-900 text-black">-- Toutes les filières --</option>
            {filieresDuParcours.map((f) => (
              <option key={f.id} value={f.id} className="bg-gray-900 text-black">
                {f.nom}
              </option>
            ))}
          </select>
          <select
            value={filters.annee_etude}
            onChange={(e) => changerFiltre("annee_etude", e.target.value)}
            className="border border-gray-600 p-2 rounded-lg bg-gray-900 text-white disabled:bg-gray-700"
            disabled={!filters.parcours}
          >
            <option value="" className="bg-gray-900 text-black">-- Toutes les années --</option>
            {anneesDuParcours.map((a) => (
              <option key={a.id} value={a.id} className="bg-gray-900 text-black">
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
      <div className="mb-4 text-sm text-gray-300"> 
        {etudiants.length > 0
          ? `${etudiants.length} étudiant${etudiants.length > 1 ? "s" : ""} trouvé${etudiants.length > 1 ? "s" : ""}`
          : "Aucun étudiant trouvé"}
      </div>
      <div className="overflow-x-auto bg-gray-800 shadow-lg rounded-lg border border-gray-700"> 
        {loading ? (
          <div className="p-8 text-center text-white">
            <FaSync className="animate-spin mx-auto mb-4 text-2xl text-blue-400" />
            <p>Chargement...</p>
          </div>
        ) : (
          <table className="min-w-full text-sm text-white"> 
            <thead className="bg-gray-700 border-b border-gray-600"> 
              <tr>
                <th className="p-3 text-left font-semibold">#</th>
                <th className="p-3 text-left font-semibold">Num Carte</th>
                <th className="p-3 text-left font-semibold">Nom</th>
                <th className="p-3 text-left font-semibold">Prénom</th>
                <th className="p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Téléphone</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {etudiants.length > 0 ? (
                etudiants.map((etudiant, index) => (
                  <tr key={etudiant.id} className="bg-gray-800 hover:bg-gray-700 transition-colors">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{etudiant.num_carte || "-"}</td>
                    <td className="p-3">{getNom(etudiant)}</td>
                    <td className="p-3">{getPrenom(etudiant)}</td>
                    <td className="p-3">{getEmail(etudiant)}</td>
                    <td className="p-3">{getTelephone(etudiant)}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => ouvrirModaleModification(etudiant)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => supprimerEtudiant(etudiant.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400"> 
                    Aucun étudiant trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <EditStudentModal
        isOpen={modalOpen}
        onClose={fermerModale}
        student={selectedStudent}
        onSave={sauvegarderEtudiant}
      />
    </div>
  );
}