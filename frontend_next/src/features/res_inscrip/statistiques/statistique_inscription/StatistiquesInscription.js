"use client";
import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import ExportButton from "@/components/ui/ExportButton";
import api from "@/services/api"; // Import crucial pour invalidateCache
import { FaSync } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function StatistiquesAdmin() {
  const [stats, setStats] = useState({
    total_etudiants: 0,
    par_parcours: [],
    par_filiere: [],
    par_sexe: [],
    par_annee_etude: [],
  });

  const [parcoursData, setParcoursData] = useState([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [anneesEtude, setAnneesEtude] = useState([]);
  const [filters, setFilters] = useState({
    anneeAcademique: "",
    parcours: "",
    filiere: "",
    annee_etude: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [displayMode, setDisplayMode] = useState("parcours");

  // Chargement initial des listes déroulantes
  useEffect(() => {
    Promise.all([
      etudiantService.getParcoursAvecRelations(),
      etudiantService.getAnneesAcademiques(),
    ])
      .then(([parcours, annees]) => {
        setParcoursData(parcours);
        setAnneesAcademiques(annees);
        setError("");
      })
      .catch(() => setError("Erreur de chargement des données"));
  }, []);

  // Mise à jour des filières & années d'étude quand le parcours change
  useEffect(() => {
    if (!filters.parcours) {
      setFilieres([]);
      setAnneesEtude([]);
      return;
    }
    const p = parcoursData.find((p) => p.id.toString() === filters.parcours);
    setFilieres(p?.filieres || []);
    setAnneesEtude(p?.annees_etude || []);
  }, [filters.parcours, parcoursData]);

  // Fonction de chargement des stats
  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const cleanedFilters = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) cleanedFilters[key] = value;
      });

      const data = await etudiantService.getStatistiquesInscriptions(cleanedFilters);
      setStats(data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Erreur serveur";
      setError("Erreur : " + msg);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir manuellement (bouton)
  const rafraichir = () => {
    api.invalidateCache();   // Vide tout le cache
    loadStats();             // Recharge depuis le serveur
  };

  // Charger les stats à chaque changement de filtre (avec léger debounce)
  useEffect(() => {
    const timer = setTimeout(() => loadStats(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // Charger au premier rendu
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainData = displayMode === "parcours" ? stats.par_parcours : stats.par_filiere;
  const garcons = stats.par_sexe.find((s) => s.sexe === "M")?.nombre_etudiants || 0;
  const filles = stats.par_sexe.find((s) => s.sexe === "F")?.nombre_etudiants || 0;
  const total = stats.total_etudiants;

  const prepareExport = () => {
    const rows = [];
    const anneeLabel = filters.anneeAcademique || "Toutes les années";
    const parcoursLabel = parcoursData.find((p) => p.id.toString() === filters.parcours)?.libelle || "Tous";
    const filiereLabel = filieres.find((f) => f.id.toString() === filters.filiere)?.nom || "Toutes";
    const anneeEtudeLabel = anneesEtude.find((a) => a.id.toString() === filters.annee_etude)?.libelle || "Toutes";

    rows.push({ Rapport: "STATISTIQUES INSCRIPTIONS" });
    rows.push({
      "Année Académique": anneeLabel,
      Parcours: parcoursLabel,
      Filière: filiereLabel,
      "Année d'étude": anneeEtudeLabel,
      Date: new Date().toLocaleDateString("fr-FR"),
    });
    rows.push({});
    rows.push({ "Total étudiants": total });
    rows.push({ Garçons: `${garcons} (${total > 0 ? ((garcons / total) * 100).toFixed(1) : 0}%)` });
    rows.push({ Filles: `${filles} (${total > 0 ? ((filles / total) * 100).toFixed(1) : 0}%)` });
    rows.push({});

    stats.par_parcours.forEach((p) => {
      const pct = total > 0 ? ((p.nombre_etudiants / total) * 100).toFixed(1) : 0;
      rows.push({ Parcours: p.libelle, Étudiants: p.nombre_etudiants, Pourcentage: `${pct}%` });
    });
    stats.par_filiere.forEach((f) => {
      const pct = total > 0 ? ((f.nombre_etudiants / total) * 100).toFixed(1) : 0;
      rows.push({ Filière: f.nom, Étudiants: f.nombre_etudiants, Pourcentage: `${pct}%` });
    });

    return rows;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Titre + boutons */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-teal-900">Statistiques des Inscriptions</h2>

          <div className="flex gap-4">
            {/* Bouton Rafraîchir */}
            <button
              onClick={rafraichir}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              Rafraîchir
            </button>

            <ExportButton
              data={prepareExport()}
              filename={`Stats_${new Date().toISOString().split("T")[0]}`}
              className="px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
              disabled={total === 0}
            />
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <select
              value={filters.anneeAcademique}
              onChange={(e) => setFilters({ ...filters, anneeAcademique: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toutes les années académiques</option>
              {anneesAcademiques.map((a) => (
                <option key={a.id} value={a.libelle}>
                  {a.libelle}
                </option>
              ))}
            </select>

            <select
              value={filters.parcours}
              onChange={(e) =>
                setFilters({ ...filters, parcours: e.target.value, filiere: "", annee_etude: "" })
              }
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Tous les parcours</option>
              {parcoursData.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.libelle}
                </option>
              ))}
            </select>

            <select
              value={filters.filiere}
              onChange={(e) => setFilters({ ...filters, filiere: e.target.value })}
              disabled={!filters.parcours}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toutes les filières</option>
              {filieres.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>

            <select
              value={filters.annee_etude}
              onChange={(e) => setFilters({ ...filters, annee_etude: e.target.value })}
              disabled={!filters.parcours}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Toutes les années d'étude</option>
              {anneesEtude.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setDisplayMode(displayMode === "parcours" ? "filiere" : "parcours")}
            className="px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800"
          >
            Voir par {displayMode === "parcours" ? "Filière" : "Parcours"}
          </button>
        </div>

        {/* Contenu stats (inchangé) */}
        {loading ? (
          <div className="text-center py-20 text-xl text-gray-600">Chargement...</div>
        ) : (
          <>
            {/* Cartes résumé */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-5xl font-bold text-teal-700">{total}</div>
                <div className="text-gray-600 mt-2">Total étudiants</div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-5xl font-bold text-blue-700">{garcons}</div>
                <div className="text-gray-600 mt-2">Garçons</div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-5xl font-bold text-pink-700">{filles}</div>
                <div className="text-gray-600 mt-2">Filles</div>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="text-5xl font-bold text-purple-700">{mainData.length}</div>
                <div className="text-gray-600 mt-2">
                  {displayMode === "parcours" ? "Parcours" : "Filières"}
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bar */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">
                  Par {displayMode === "parcours" ? "Parcours" : "Filière"}
                </h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: mainData.map((i) => i.libelle || i.nom || "Inconnu"),
                      datasets: [
                        {
                          label: "Étudiants",
                          data: mainData.map((i) => i.nombre_etudiants),
                          backgroundColor: "rgba(20, 184, 166, 0.8)",
                        },
                      ],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>

              {/* Pie */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Répartition par sexe</h3>
                <div className="h-80 flex items-center justify-center">
                  <div className="w-80 h-80">
                    <Pie
                      data={{
                        labels: ["Garçons", "Filles"],
                        datasets: [{ data: [garcons, filles], backgroundColor: ["#3B82F6", "#EC4899"] }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>

              {/* Bar année d'étude */}
              <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">Par année d'étude</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: stats.par_annee_etude.map((a) => a.libelle),
                      datasets: [
                        {
                          label: "Étudiants",
                          data: stats.par_annee_etude.map((a) => a.nombre_etudiants),
                          backgroundColor: "rgba(147, 51, 234, 0.8)",
                        },
                      ],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}