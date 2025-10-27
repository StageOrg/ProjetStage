// frontend_next/src/pages/res_inscrip/modification/EditStudent.js
"use client";
import React, { useState, useEffect } from "react";
import { FaSearch, FaFileExport, FaSync, FaEdit, FaTrash } from "react-icons/fa";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import EditStudentModal from "@/features/res_inscrip/modificationEtudiant/EditStudent";
import ExportButton from "@/components/ui/ExportButton";  // Import du bouton d'export

export default function GestionEtudiantsAdmin() {
  const [etudiants, setEtudiants] = useState([]);
  const [parcoursData, setParcoursData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // État pour la modale
  const [selectedStudent, setSelectedStudent] = useState(null); // Étudiant sélectionné pour modification
  const [filters, setFilters] = useState({
    search: "",
    parcours: "",
    filiere: "",
    annee_etude: "",
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
    const loadFilieresAndAnnees = async () => {
      try {
        let filieres = [];
        let annees = [];
        if (filters.parcours) {
          const parcoursTrouve = parcoursData.find(
            (p) => p.id.toString() === filters.parcours.toString()
          );
          if (parcoursTrouve) {
            console.log("Parcours sélectionné:", parcoursTrouve);
            filieres = parcoursTrouve.filieres || [];
            annees = parcoursTrouve.annees_etude || [];
          }
        } else {
          // Charger toutes les filières et années quand "Tous les parcours" est sélectionné
          filieres = await etudiantService.getFilieresByParcours(); // Sans paramètre pour toutes
          annees = await etudiantService.getAnneesByParcours(); // Sans paramètre pour toutes
        }
        setFilieresDuParcours(filieres);
        setAnneesDuParcours(annees);

        // Validation seulement si parcours spécifique
        if (filters.parcours) {
          const filiereValide = filieres.some(
            (f) => f.id.toString() === filters.filiere
          );
          const anneeValide = annees.some(
            (a) => a.id.toString() === filters.annee_etude
          );
          if (!filiereValide) setFilters((prev) => ({ ...prev, filiere: "" }));
          if (!anneeValide) setFilters((prev) => ({ ...prev, annee_etude: "" }));
        }
      } catch (err) {
        console.error("Erreur chargement filières/années:", err);
        setFilieresDuParcours([]);
        setAnneesDuParcours([]);
      }
    };

    loadFilieresAndAnnees();
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

  // Préparation des données pour export (avec en-têtes custom et ajout de Filière/Parcours) - CORRIGÉ
  const prepareExportData = () => {
    return etudiants.map((e) => ({
      "Num Carte": e.num_carte || "",
      Nom: e.utilisateur?.last_name || e.last_name || "",
      "Prénom": e.utilisateur?.first_name || e.first_name || "",
      Email: e.utilisateur?.email || e.email || "",
      Téléphone: e.utilisateur?.telephone || e.telephone || "",
      "Date Naissance": e.date_naiss || "",
      "Lieu Naissance": e.lieu_naiss || "",
      Filière: e.filiere_info || "",
      Parcours: e.parcours_info || "",
    }));
  };

  // En-têtes custom (alignés sur le tableau + Filière/Parcours)
  const exportHeaders = [
    "Num Carte",
    "Nom",
    "Prénom",
    "Email",
    "Téléphone",
    "Date Naissance",
    "Lieu Naissance",
    "Filière",
    "Parcours"
  ];

  const handleExportStart = (type) => {
    console.log(`Début export ${type.toUpperCase()}`);
  };

  const handleExportEnd = (type, result) => {
    if (result.success) {
      console.log(`Export ${type.toUpperCase()} réussi !`);
      alert(`Export ${type.toUpperCase()} réussi !`);
    } else {
      console.error(`Erreur export ${type.toUpperCase()}:`, result.error);
      alert(`Erreur lors de l'export ${type.toUpperCase()} : ${result.error}`);
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
  const getFiliere = (etudiant) => etudiant.filiere_info || "-";
  const getParcours = (etudiant) => etudiant.parcours_info || "-";

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <h2 className="text-2xl font-bold mb-4 text-black">Gestion des Étudiants</h2>
      <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-white">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => changerFiltre("search", e.target.value)}
              className="outline-none bg-transparent text-black placeholder-gray-500"
            />
          </div>
          <select
            value={filters.parcours}
            onChange={(e) => changerFiltre("parcours", e.target.value)}
            className="border border-gray-300 p-2 rounded-lg bg-white text-black"
          >
            <option value="" className="bg-white text-black">-- Tous les parcours --</option>
            {parcoursData.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-black">
                {p.libelle}
              </option>
            ))}
          </select>
          <select
            value={filters.filiere}
            onChange={(e) => changerFiltre("filiere", e.target.value)}
            className="border border-gray-300 p-2 rounded-lg bg-white text-black"
          >
            <option value="" className="bg-white text-black">-- Toutes les filières --</option>
            {filieresDuParcours.map((f) => (
              <option key={f.id} value={f.id} className="bg-white text-black">
                {f.nom}
              </option>
            ))}
          </select>
          <select
            value={filters.annee_etude}
            onChange={(e) => changerFiltre("annee_etude", e.target.value)}
            className="border border-gray-300 p-2 rounded-lg bg-white text-black"
          >
            <option value="" className="bg-white text-black">-- Toutes les années --</option>
            {anneesDuParcours.map((a) => (
              <option key={a.id} value={a.id} className="bg-white text-black">
                {a.libelle}
              </option>
            ))}
          </select>
          {/* Remplacement du bouton Excel custom par ExportButton */}
          <ExportButton
            data={prepareExportData()}  // Données préparées avec Filière/Parcours
            filename={`etudiants_${new Date().toISOString().split("T")[0]}`}
            headers={exportHeaders}  // En-têtes custom (tableau + Filière/Parcours)
            onExportStart={handleExportStart}
            onExportEnd={handleExportEnd}
            disabled={etudiants.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
          />
        </div>
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {etudiants.length > 0
          ? `${etudiants.length} étudiant${etudiants.length > 1 ? "s" : ""} trouvé${etudiants.length > 1 ? "s" : ""}`
          : "Aucun étudiant trouvé"}
      </div>
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-black">
            <FaSync className="animate-spin mx-auto mb-4 text-2xl text-blue-500" />
            <p>Chargement...</p>
          </div>
        ) : (
          <table className="min-w-full text-sm text-black">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left font-semibold">#</th>
                <th className="p-3 text-left font-semibold">Num Carte</th>
                <th className="p-3 text-left font-semibold">Nom</th>
                <th className="p-3 text-left font-semibold">Prénom</th>
                <th className="p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Téléphone</th>
                <th className="p-3 text-left font-semibold">Filière</th>
                <th className="p-3 text-left font-semibold">Parcours</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {etudiants.length > 0 ? (
                etudiants.map((etudiant, index) => (
                  <tr key={etudiant.id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{etudiant.num_carte || "-"}</td>
                    <td className="p-3">{getNom(etudiant)}</td>
                    <td className="p-3">{getPrenom(etudiant)}</td>
                    <td className="p-3">{getEmail(etudiant)}</td>
                    <td className="p-3">{getTelephone(etudiant)}</td>
                    <td className="p-3">{getFiliere(etudiant)}</td>
                    <td className="p-3">{getParcours(etudiant)}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => ouvrirModaleModification(etudiant)}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => supprimerEtudiant(etudiant.id)}
                        className="text-red-600 hover:text-red-500"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500">
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