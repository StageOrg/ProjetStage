"use client";
import React, { useState, useEffect } from "react";
import { FaChartBar, FaSearch } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StatistiquesAdmin() {
  const [stats, setStats] = useState({
    total_etudiants: 0,
    par_parcours: [],
    par_filiere: [],
  });
  const [parcoursData, setParcoursData] = useState([]);
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);
  const [filters, setFilters] = useState({
    parcours: "",
    filiere: "",
    annee_etude: "",
  });
  const [loading, setLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState("parcours");

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permet au graphique de s'adapter à la hauteur du conteneur
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

  return (
    <div className="w-screen h-screen bg-white/80 backdrop-blur-md overflow-auto flex flex-col items-center p-6">
      <h2 className="flex items-center gap-3 text-2xl font-bold text-teal-900 mb-6">
        <FaChartBar className="text-teal-700" /> Statistiques des Inscriptions
      </h2>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6 w-full max-w-6xl">
        <select
          value={filters.parcours}
          onChange={(e) => changerFiltre("parcours", e.target.value)}
          className="border p-2 rounded-lg flex-1 min-w-[200px]"
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
          className="border p-2 rounded-lg flex-1 min-w-[200px]"
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
          className="border p-2 rounded-lg flex-1 min-w-[200px]"
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
          onClick={toggleDisplayMode}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8 w-full max-w-6xl">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-teal-700">{stats.total_etudiants || 0}</span>
              <span className="text-gray-500">Inscrits</span>
            </div>
            {/* Ajouter d'autres statistiques ici si nécessaire */}
          </div>

          {/* Graphique */}
          {stats[displayMode === "parcours" ? "par_parcours" : "par_filiere"].length > 0 ? (
            <div className="w-full max-w-6xl h-[60vh] mb-8">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="text-center text-gray-600">
              Aucune donnée disponible pour les filtres sélectionnés.
            </div>
          )}
        </>
      )}
    </div>
  );
}