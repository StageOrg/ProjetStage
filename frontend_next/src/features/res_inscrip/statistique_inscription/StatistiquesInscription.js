"use client";
import React, { useState, useEffect } from "react";
import { FaChartBar, FaFileDownload, FaFilePdf, FaFileExcel, FaFileCsv } from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import ExportButton from "@/components/ui/ExportButton";  // Import du bouton d'export

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function StatistiquesAdmin() {
  const [stats, setStats] = useState({
    total_etudiants: 0,
    par_parcours: [],
    par_filiere: [],
    par_sexe: [],
  });
  const [parcoursData, setParcoursData] = useState([]);
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);
  const [filters, setFilters] = useState({
    parcours: "",
    filiere: "",
    annee_etude: "",
    sexe: "",
  });
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState("parcours");
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    chargerParcoursAvecRelations();
    chargerStatistiques();
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      chargerStatistiques();
    }, 100);
    return () => clearTimeout(timer);
  }, [filters]);

  const chargerParcoursAvecRelations = async () => {
    try {
      console.log("Chargement des parcours...");
      const parcours = await etudiantService.getParcoursAvecRelations();
      setParcoursData(parcours);
    } catch (err) {
      console.error("Erreur lors du chargement des parcours:", err);
    }
  };

  const chargerStatistiques = async () => {
    try {
      setLoading(true);
      const data = await etudiantService.getStatistiquesInscriptions(filters);
      setStats(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  const changerFiltre = (cle, valeur) => {
    setFilters((prev) => ({ ...prev, [cle]: valeur }));
  };

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => (prev === "parcours" ? "filiere" : "parcours"));
  };

  // Préparation des données pour export (basé sur le mode d'affichage actuel)
  const prepareExportData = () => {
    const items = displayMode === "parcours" ? stats.par_parcours : stats.par_filiere;
    return items.map((item) => ({
      Libelle: item.libelle || item.nom || "Inconnu",
      "Nombre d'étudiants": item.nombre_etudiants || 0,
      Pourcentage: stats.total_etudiants > 0 ? ((item.nombre_etudiants / stats.total_etudiants) * 100).toFixed(1) + "%" : "0%",
    }));
  };

  // En-têtes custom pour l'export
  const exportHeaders = ["Libelle", "Nombre d'étudiants", "Pourcentage"];

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

  const chartData = {
    labels:
      displayMode === "parcours"
        ? stats.par_parcours.map((item) => item.libelle || "Inconnu")
        : stats.par_filiere.map((item) => item.nom || "Inconnu"),
    datasets: [
      {
        label: "Nombre d'étudiants",
        data:
          displayMode === "parcours"
            ? stats.par_parcours.map((item) => item.nombre_etudiants || 0)
            : stats.par_filiere.map((item) => item.nombre_etudiants || 0),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const sexeChartData = {
    labels: stats.par_sexe.map((item) =>
      item.sexe === "M" ? "Masculin" : item.sexe === "F" ? "Féminin" : "Autre"
    ),
    datasets: [
      {
        label: "Répartition par sexe",
        data: stats.par_sexe.map((item) => item.nombre_etudiants || 0),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Étudiants par ${displayMode === "parcours" ? "Parcours" : "Filière"}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Nombre d'étudiants" },
      },
      x: {
        title: { display: true, text: displayMode === "parcours" ? "Parcours" : "Filière" },
      },
    },
  };

  const sexeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Répartition par Sexe",
      },
    },
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto flex flex-col items-center p-6">
      {/* Header avec titre et bouton d'export */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-teal-900">
          <FaChartBar className="text-teal-700" /> Statistiques des Inscriptions
        </h2>
        {/* Bouton Export avec ExportButton */}
        <ExportButton
          data={prepareExportData()}  // Données préparées (parcours ou filière)
          filename={`stats_inscriptions_${new Date().toISOString().split("T")[0]}`}
          headers={exportHeaders}  // En-têtes custom
          onExportStart={handleExportStart}
          onExportEnd={handleExportEnd}
          disabled={stats.total_etudiants === 0}
          className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-md"
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6 w-full max-w-6xl">
        <select
          value={filters.parcours}
          onChange={(e) => changerFiltre("parcours", e.target.value)}
          className="border border-gray-300 p-2 rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          className="border border-gray-300 p-2 rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
          className="border border-gray-300 p-2 rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          disabled={!filters.parcours}
        >
          <option value="">-- Toutes les années --</option>
          {anneesDuParcours.map((a) => (
            <option key={a.id} value={a.id}>
              {a.libelle}
            </option>
          ))}
        </select>
        <select
          value={filters.sexe}
          onChange={(e) => changerFiltre("sexe", e.target.value)}
          className="border border-gray-300 p-2 rounded-lg flex-1 min-w-[200px] focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">-- Tous les sexes --</option>
          <option value="M">Masculin</option>
          <option value="F">Féminin</option>
        </select>
        <button
          onClick={toggleDisplayMode}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-md"
        >
          Afficher par {displayMode === "parcours" ? "Filière" : "Parcours"}
        </button>
      </div>

      {loading ? (
        <div className="text-center">
          <span className="animate-spin inline-block w-8 h-8 border-4 border-teal-700 border-t-transparent rounded-full"></span>
          <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : (
        <>
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-6xl">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center border-l-4 border-teal-700">
              <span className="text-4xl font-extrabold text-teal-700">{stats.total_etudiants || 0}</span>
              <span className="text-gray-500 mt-2">Total Inscrits</span>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center border-l-4 border-blue-700">
              <span className="text-4xl font-extrabold text-blue-700">{stats.par_parcours.length || 0}</span>
              <span className="text-gray-500 mt-2">Parcours</span>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center border-l-4 border-green-700">
              <span className="text-4xl font-extrabold text-green-700">{stats.par_filiere.length || 0}</span>
              <span className="text-gray-500 mt-2">Filières</span>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center border-l-4 border-purple-700">
              <span className="text-4xl font-extrabold text-purple-700">
                {stats.par_sexe.find(s => s.sexe === "F")?.nombre_etudiants || 0}
              </span>
              <span className="text-gray-500 mt-2">Étudiantes</span>
            </div>
          </div>

          {/* Graphiques */}
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Graphique principal (Bar) */}
            {stats[displayMode === "parcours" ? "par_parcours" : "par_filiere"].length > 0 ? (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 h-[400px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-600">
                  Aucune donnée disponible pour les filtres sélectionnés.
                </div>
              </div>
            )}

            {/* Graphique par sexe (Pie) */}
            {stats.par_sexe.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 h-[400px]">
                <Pie data={sexeChartData} options={sexeChartOptions} />
              </div>
            )}
          </div>

          {/* Tableau récapitulatif */}
          <div className="w-full max-w-6xl bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-teal-700 text-white font-bold">
              Détails par {displayMode === "parcours" ? "Parcours" : "Filière"}
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {displayMode === "parcours" ? "Parcours" : "Filière"}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nombre d'étudiants
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Pourcentage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(displayMode === "parcours" ? stats.par_parcours : stats.par_filiere).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.libelle || item.nom || "Inconnu"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.nombre_etudiants || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {stats.total_etudiants > 0
                        ? ((item.nombre_etudiants / stats.total_etudiants) * 100).toFixed(1)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}