"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaFileExport, FaSync, FaEdit, FaTrash,
  FaAddressCard, FaFilePdf, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { debounce } from "lodash";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import EditStudentModal from "@/features/res_inscrip/modificationEtudiant/EditStudent";
import ExportButton from "@/components/ui/ExportButton";
import { useExportPDF } from "@/components/exports/useExportPDF";
import api from "@/services/api"; 
import toast from 'react-hot-toast';

export default function GestionEtudiantsAdmin() {
  const router = useRouter();
  const { exportToPDF } = useExportPDF();
  const [etudiants, setEtudiants] = useState([]);
  const [parcoursData, setParcoursData] = useState([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  const [filters, setFilters] = useState({search: "",annee_academique: "",parcours: "",filiere: "",annee_etude: "",
  });
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);

  // Chargement initial
  useEffect(() => {
    etudiantService.getParcoursAvecRelations().then(setParcoursData);
    etudiantService.getAnneesAcademiques().then(setAnneesAcademiques);
  }, []);

  // Mise à jour filières/années quand parcours change
  useEffect(() => {
    const parcours = parcoursData.find(p => p.id.toString() === filters.parcours);
    setFilieresDuParcours(parcours?.filieres || []);
    setAnneesDuParcours(parcours?.annees_etude || []);
  }, [filters.parcours, parcoursData]);

  // Recherche debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters(prev => ({ ...prev, search: value }));
      setCurrentPage(1);
    }, 600),
    []
  );

  // Chargement des étudiants
  const chargerEtudiants = async () => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      const data = await etudiantService.getAllEtudiants({
        ...cleanFilters,
        page: currentPage,
        page_size: itemsPerPage,
      });
      setEtudiants(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
    } catch (err) {
      console.error("Erreur chargement étudiants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerEtudiants();
  }, [filters, currentPage]);

  // RAFRAÎCHIR : vide le cache + recharge tout
  const rafraichir = () => {
    chargerEtudiants();
  };

  // FIX: Suppression avec traçabilité
  const supprimerEtudiant = async (id) => {
    if (!confirm("Supprimer cet étudiant ?")) return;
    
    try {
      // 1. Récupérer les infos complètes de l'étudiant AVANT suppression
      const etudiant = etudiants.find(e => e.id === id);
      
      if (!etudiant) {
        alert("Étudiant introuvable");
        return;
      }

      // 2. Récupérer les inscriptions pour avoir l'année académique
      let anneeAcademique = '';
      let numeroInscription = etudiant.num_carte || '';
      
      try {
        const inscriptionsRes = await api.get(`/etudiants/${id}/inscriptions/`);
        const inscriptions = inscriptionsRes.data.inscriptions || [];
        
        if (inscriptions.length > 0) {
          // Prendre la dernière inscription
          const derniereInscription = inscriptions[inscriptions.length - 1];
          anneeAcademique = derniereInscription.annee_academique || '';
          numeroInscription = derniereInscription.numero || numeroInscription;
        }
      } catch (err) {
        console.warn("Impossible de récupérer les inscriptions:", err);
      }

      // 3. Préparer les données pour l'historique
      const dataHistorique = {
        nom: etudiant.last_name || 'Inconnu',
        prenom: etudiant.first_name || '',
        username: etudiant.username || '',
        email: etudiant.email || '',
        numero_inscription: numeroInscription,
        annee_academique: anneeAcademique,
        telephone: etudiant.telephone || '',
        date_naiss: etudiant.date_naiss || '',
        lieu_naiss: etudiant.lieu_naiss || '',
      };

      // 4. Enregistrer dans l'historique AVANT la suppression
      await api.post('/inscription/enregistrer-suppression/', {
        etudiant_supprime: dataHistorique
      });

      // 5. Supprimer l'étudiant
      await etudiantService.deleteEtudiant(id);
      
      // 6. Rafraîchir la liste
      chargerEtudiants();
      
      alert("Étudiant supprimé avec succès");
      
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression: " + (err.response?.data?.error || err.message));
    }
  };

  // Sauvegarde après édition
  const sauvegarderEtudiant = async (id, data) => {
    try {
      await etudiantService.updateEtudiant(id, data);
      toast.success("Étudiant modifié avec succès");
      setModalOpen(false);
      rafraichir();
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  // Helpers affichage
  const getPrenoms = (e) => {
    const prenom = e.first_name?.trim() || "";
    const autres = e.autre_prenom?.trim() || "";
    return [prenom, autres].filter(Boolean).join(" ") || "-";
  };

  const getFiliereParcoursAbbrev = (e) => {
    const parcoursAbbr = e.parcours_info?.abbreviation?.trim();
    const filiereAbbr = e.filiere_info?.abbreviation?.trim();
    if (parcoursAbbr && filiereAbbr) return `${parcoursAbbr}-${filiereAbbr}`.toUpperCase();
    if (e.parcours_info?.libelle && e.filiere_info?.nom) {
      return `${e.parcours_info.libelle}-${e.filiere_info.nom}`;
    }
    return "-";
  };

  const getNom = (e) => e.last_name || "Inconnu";
  const getEmail = (e) => e.email || "-";
  const getTelephone = (e) => e.telephone || "-";
  
  // Export Excel
  const prepareExportData = () => etudiants.map(e => ({
    "Num Carte": e.num_carte || "",
    Nom: getNom(e),
    Prénoms: getPrenoms(e),
    Email: getEmail(e),
    Téléphone: getTelephone(e),
    "Date Naissance": e.date_naiss || "",
    "Lieu Naissance": e.lieu_naiss || "",
    "Filière-Parcours": getFiliereParcoursAbbrev(e),
  }));

  const exportHeaders = ["Num Carte", "Nom", "Prénoms", "Email", "Téléphone", "Date Naissance", "Lieu Naissance", "Filière-Parcours"];

  // Export PDF
  const preparePDFData = () => etudiants.map((e, i) => ({
    "N°": i + 1 + (currentPage - 1) * itemsPerPage,
    "Num Carte": e.num_carte || "-",
    Nom: getNom(e),
    Prénoms: getPrenoms(e),
    Email: getEmail(e),
    Téléphone: getTelephone(e),
    "Filière-Parcours": getFiliereParcoursAbbrev(e),
  }));

  const handleExportPDF = () => {
    if (!etudiants.length) return alert("Aucun étudiant");
    
    const anneeAcademiqueLibelle = filters.annee_academique 
      ? anneesAcademiques.find(a => (a.libelle ?? a.annee) === filters.annee_academique)?.libelle || filters.annee_academique
      : null;
    
    exportToPDF(preparePDFData(), `liste_classe_${new Date().toISOString().split("T")[0]}`, {
      titre: "LISTE DE CLASSE",
      orientation: "l",
      signatureColumn: true,
      signatureWidth: 50,
      anneeAcademique: anneeAcademiqueLibelle, 
    });
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Titre + Boutons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Étudiants</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={rafraichir}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            Rafraîchir
          </button>

          <select
            value={filters.annee_academique}
            onChange={e => {
              setFilters(prev => ({ ...prev, annee_academique: e.target.value }));
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-4 py-2 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les années</option>
            {anneesAcademiques.map(annee => (
              <option key={annee.id ?? annee.libelle} value={annee.libelle ?? annee.annee}>
                {annee.libelle ?? annee.annee}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center border border-gray-300 rounded-lg p-2 bg-white">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              onChange={e => debouncedSearch(e.target.value)}
              className="outline-none bg-transparent text-black w-64"
            />
          </div>

          <select
            value={filters.parcours}
            onChange={e => {
              setFilters(prev => ({ ...prev, parcours: e.target.value, filiere: "", annee_etude: "" }));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-2 rounded-lg bg-white"
          >
            <option value="">-- Tous les parcours --</option>
            {parcoursData.map(p => (
              <option key={p.id} value={p.id}>{p.libelle}</option>
            ))}
          </select>

          <select
            value={filters.filiere}
            onChange={e => {
              setFilters(prev => ({ ...prev, filiere: e.target.value }));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-2 rounded-lg bg-white"
          >
            <option value="">-- Toutes les filières --</option>
            {filieresDuParcours.map(f => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>

          <select
            value={filters.annee_etude}
            onChange={e => {
              setFilters(prev => ({ ...prev, annee_etude: e.target.value }));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-2 rounded-lg bg-white"
          >
            <option value="">-- Toutes les années --</option>
            {anneesDuParcours.map(a => (
              <option key={a.id} value={a.id}>{a.libelle}</option>
            ))}
          </select>

          <div className="flex gap-3 ml-auto">
            <ExportButton
              data={prepareExportData()}
              filename={`etudiants_${new Date().toISOString().split("T")[0]}`}
              headers={exportHeaders}
              disabled={etudiants.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FaFileExport /> Exporter
            </ExportButton>

            <button
              onClick={handleExportPDF}
              disabled={etudiants.length === 0}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <FaFilePdf /> Liste Signature
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <FaSync className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
            <p className="text-gray-600">Chargement des étudiants...</p>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-100 text-black sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left font-semibold">#</th>
                    <th className="p-3 text-left font-semibold">Num Carte</th>
                    <th className="p-3 text-left font-semibold">Nom</th>
                    <th className="p-3 text-left font-semibold">Prénoms</th>
                    <th className="p-3 text-left font-semibold">Email</th>
                    <th className="p-3 text-left font-semibold">Téléphone</th>
                    <th className="p-3 text-left font-semibold">Parcours-Filière</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {etudiants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-500">
                        Aucun étudiant trouvé
                      </td>
                    </tr>
                  ) : (
                    etudiants.map((e, i) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                        <td className="p-3 font-medium">{e.num_carte || "-"}</td>
                        <td className="p-3 font-medium">{getNom(e)}</td>
                        <td className="p-3">{getPrenoms(e)}</td>
                        <td className="p-3 text-sm">{getEmail(e)}</td>
                        <td className="p-3">{getTelephone(e)}</td>
                        <td className="p-3 font-medium text-gray-800">
                          {getFiliereParcoursAbbrev(e)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setSelectedStudent(e);
                                setModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifier"
                            >
                              <FaEdit size={18} />
                            </button>
                            <button
                              onClick={() => supprimerEtudiant(e.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer"
                            >
                              <FaTrash size={18} />
                            </button>
                            <button
                              onClick={() => router.push(`/resp_inscription/etudiants/${e.id}/inscriptions`)}
                              className="flex items-center gap-1 text-green-600 hover:text-green-800"
                              title="Voir détails"
                            >
                              <FaAddressCard size={18} />
                              <span className="text-xs">Détails</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between text-sm">
                <div className="text-gray-700">
                  Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> sur{" "}
                  <span className="font-medium">{totalCount}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaChevronLeft />
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const n = i + 1;
                    if (n === 1 || n === totalPages || Math.abs(n - currentPage) <= 2) {
                      return (
                        <button
                          key={n}
                          onClick={() => goToPage(n)}
                          className={`px-3 py-1 rounded border ${
                            currentPage === n
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          {n}
                        </button>
                      );
                    }
                    if (n === currentPage - 3 || n === currentPage + 3) return <span key={n}>...</span>;
                    return null;
                  })}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditStudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        student={selectedStudent}
        onSave={sauvegarderEtudiant}
      />
    </div>
  );
}