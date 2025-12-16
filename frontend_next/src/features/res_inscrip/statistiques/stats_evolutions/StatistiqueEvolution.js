"use client";
import React, { useState, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import { FaChartLine, FaArrowUp, FaArrowDown, FaEquals } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import api from "@/services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function StatistiquesEvolution() {
  const [data, setData] = useState({
    evolution_annuelle: [],
    taux_croissance_moyen: 0,
    previsions: [],
    evolution_par_filiere: [],
    evolution_par_parcours: [],
    nombre_annees: 0
  });
  
  const [parcours, setParcours] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [filters, setFilters] = useState({ parcours: "", filiere: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger parcours et filières
    Promise.all([
      api.get("/inscription/parcours/"),
      api.get("/inscription/filiere/")
    ]).then(([parcoursRes, filieresRes]) => {
      setParcours(parcoursRes.data.results || parcoursRes.data);
      setFilieres(filieresRes.data.results || filieresRes.data);
    });
  }, []);

  useEffect(() => {
    chargerStats();
  }, [filters]);

  const chargerStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.parcours) params.parcours = filters.parcours;
      if (filters.filiere) params.filiere = filters.filiere;
      
      const response = await api.get("/inscription/stats/evolution/", { params });
      setData(response.data);
    } catch (err) {
      console.error("Erreur chargement stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Données pour graphique évolution annuelle
  const evolutionChart = {
    labels: data.evolution_annuelle.map(item => item.annee),
    datasets: [
      {
        label: "Nombre d'inscrits",
        data: data.evolution_annuelle.map(item => item.total_inscrits),
        borderColor: "#0d9488",
        backgroundColor: "rgba(13, 148, 136, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  // Données pour graphique prévisions
  const previsionChart = {
    labels: ["Année actuelle", "Prévision"],
    datasets: data.previsions.map((prev, i) => ({
      label: prev.scenario,
      data: [
        data.evolution_annuelle[data.evolution_annuelle.length - 1]?.total_inscrits || 0,
        prev.prevision
      ],
      backgroundColor: i === 0 ? "rgba(239, 68, 68, 0.6)" : i === 1 ? "rgba(59, 130, 246, 0.6)" : "rgba(34, 197, 94, 0.6)",
      borderColor: i === 0 ? "#ef4444" : i === 1 ? "#3b82f6" : "#22c55e",
      borderWidth: 2
    }))
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const getIconeCroissance = (pct) => {
    if (pct > 0) return <FaArrowUp className="text-green-600" />;
    if (pct < 0) return <FaArrowDown className="text-red-600" />;
    return <FaEquals className="text-gray-600" />;
  };

  const derniereAnnee = data.evolution_annuelle[data.evolution_annuelle.length - 1];
  const croissanceRecente = derniereAnnee?.croissance_pct || 0;

  return (
    <div className="min-h-screen  justify-center ">
      <div className="max-w-7xl ">
        
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <FaChartLine className="text-teal-600" /> 
            Évolution & Prévisions des Inscriptions
          </h1>
          <p className="text-gray-600">
            Analyse de l'évolution sur {data.nombre_annees} ans et prévisions pour l'année prochaine
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.parcours}
              onChange={e => setFilters({ ...filters, parcours: e.target.value, filiere: "" })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous les parcours</option>
              {parcours.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
            </select>
            
            <select
              value={filters.filiere}
              onChange={e => setFilters({ ...filters, filiere: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-2">Inscrits {derniereAnnee?.annee}</div>
                <div className="text-4xl font-bold text-teal-700">{derniereAnnee?.total_inscrits || 0}</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-2">Croissance récente</div>
                <div className={`text-4xl font-bold flex items-center justify-center gap-2 ${
                  croissanceRecente > 0 ? "text-green-600" : croissanceRecente < 0 ? "text-red-600" : "text-gray-600"
                }`}>
                  {getIconeCroissance(croissanceRecente)}
                  {Math.abs(croissanceRecente).toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-2">Croissance moyenne</div>
                <div className={`text-4xl font-bold ${
                  data.taux_croissance_moyen > 0 ? "text-green-600" : "text-gray-600"
                }`}>
                  {data.taux_croissance_moyen > 0 ? "+" : ""}{data.taux_croissance_moyen}%
                </div>
                <div className="text-xs text-gray-500 mt-1">sur {data.nombre_annees} ans</div>
              </div>
            </div>

            {/* Graphique évolution */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                 Évolution sur {data.nombre_annees} ans
              </h2>
              <div className="h-96">
                <Line data={evolutionChart} options={chartOptions} />
              </div>
            </div>

            {/* Tableau détaillé */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="bg-teal-700 text-white p-4 font-bold">
                Détails par année académique
              </div>
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Année</th>
                    <th className="p-3 text-right">Inscrits</th>
                    <th className="p-3 text-right">Évolution</th>
                    <th className="p-3 text-right">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evolution_annuelle.map((item, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium">{item.annee}</td>
                      <td className="p-3 text-right text-2xl font-bold">{item.total_inscrits}</td>
                      <td className="p-3 text-right">
                        {i > 0 && (
                          <span className={item.croissance > 0 ? "text-green-600" : item.croissance < 0 ? "text-red-600" : "text-gray-600"}>
                            {item.croissance > 0 ? "+" : ""}{item.croissance}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {i > 0 && (
                          <span className={`flex items-center justify-end gap-1 font-semibold ${
                            item.croissance_pct > 0 ? "text-green-600" : item.croissance_pct < 0 ? "text-red-600" : "text-gray-600"
                          }`}>
                            {getIconeCroissance(item.croissance_pct)}
                            {item.croissance_pct > 0 ? "+" : ""}{item.croissance_pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Prévisions */}
            {data.previsions.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                   Prévisions pour l'année prochaine
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {data.previsions.map((prev, i) => (
                    <div key={i} className={`bg-white rounded-lg p-6 text-center border-2 ${
                      i === 0 ? "border-red-300" : i === 1 ? "border-blue-300" : "border-green-300"
                    }`}>
                      <div className="text-sm font-medium text-gray-600 mb-2">{prev.scenario}</div>
                      <div className={`text-3xl font-bold mb-2 ${
                        i === 0 ? "text-red-600" : i === 1 ? "text-blue-600" : "text-green-600"
                      }`}>
                        {prev.prevision}
                      </div>
                      <div className="text-sm text-gray-500">({prev.taux > 0 ? "+" : ""}{prev.taux}%)</div>
                    </div>
                  ))}
                </div>

                <div className="h-64">
                  <Bar data={previsionChart} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Évolution par filière */}
            {data.evolution_par_filiere.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                   Évolution par filière
                </h2>
                <div className="space-y-4">
                  {data.evolution_par_filiere.map((filiere, i) => (
                    <div key={i} className="border-l-4 border-teal-500 pl-4">
                      <div className="font-bold text-lg text-gray-800">{filiere.filiere}</div>
                      <div className="flex gap-4 mt-2">
                        {filiere.annees.map((annee, j) => (
                          <div key={j} className="text-sm">
                            <span className="text-gray-600">{annee.annee}:</span>
                            <span className="font-bold ml-1">{annee.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}