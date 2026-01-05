"use client";
import React, { useState, useEffect } from "react";
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
import ExportButton from "@/components/ui/ExportButton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function StatistiquesAbandon() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anneesAcademiques, setAnneesAcademiques] = useState([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState("");

  // Charger les années académiques au montage
  useEffect(() => {
    etudiantService
      .getAnneesAcademiques()
      .then((annees) => {
        setAnneesAcademiques(annees);
        // Sélectionner automatiquement l'année la plus récente
        if (annees.length > 0) {
          const derniereAnnee = annees.sort((a, b) => 
            b.libelle.localeCompare(a.libelle)
          )[0];
          setAnneeSelectionnee(derniereAnnee.libelle);
        }
      })
      .catch((err) => {
        console.error(" Erreur chargement années:", err);
      });
  }, []);

  // Charger les stats quand l'année change
  useEffect(() => {
    if (!anneeSelectionnee) return;
    
    setLoading(true);
    setError("");
    
    etudiantService
      .getStatistiquesAbandon(anneeSelectionnee)
      .then((res) => {
        console.log("Données reçues:", res);
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(" Erreur:", err);
        setError("Impossible de charger les statistiques d'abandon");
        setLoading(false);
      });
  }, [anneeSelectionnee]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Calcul du taux d'abandon en cours...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <strong>Erreur :</strong> {error || "Données indisponibles"}
          </div>
        </div>
      </div>
    );
  }

  const { global: g, par_parcours, par_filiere, par_annee_etude } = data;

  const prepareExport = () => {
    const rows = [
      { Rapport: "TAUX D'ABANDON" },
      { "Année analysée": g.annee_cible },
      { "Année précédente": g.annee_precedente },
      { Date: new Date().toLocaleDateString("fr-FR") },
      {},
      { "Taux global d'abandon": `${g.taux_abandon_pourcent}%` },
      { "Étudiants concernés (≥ L2 N-1)": g.total_n1 },
      { "Réinscrits": g.reinscrits },
      { "Abandons": g.abandons },
      {},
      { "DÉTAIL PAR PARCOURS": "" },
    ];
    par_parcours.forEach(p => {
      rows.push({
        Parcours: p.libelle,
        "Base N-1": p.total_n1,
        Abandons: p.abandons,
        "Taux d'abandon": `${p.taux_abandon_pourcent}%`,
      });
    });
    rows.push({}, { "DÉTAIL PAR FILIÈRE": "" });
    par_filiere.forEach(f => {
      rows.push({
        Filière: f.nom,
        "Base N-1": f.total_n1,
        Abandons: f.abandons,
        "Taux d'abandon": `${f.taux_abandon_pourcent}%`,
      });
    });
    rows.push({}, { "DÉTAIL PAR ANNÉE D'ÉTUDE": "" });
    par_annee_etude.forEach(a => {
      rows.push({
        "Année d'étude": a.libelle,
        "Base N-1": a.total_n1,
        Abandons: a.abandons,
        "Taux d'abandon": `${a.taux_abandon_pourcent}%`,
      });
    });
    return rows;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec filtre */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-3xl font-bold text-red-900">
              Taux d'abandon
            </h2>
            <ExportButton
              data={prepareExport()}
              filename={`Abandon_${g.annee_cible.replace("/", "_")}`}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
            />
          </div>

          {/* Filtre année académique */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Année cible (N) :
              </label>
              <select
                value={anneeSelectionnee}
                onChange={(e) => setAnneeSelectionnee(e.target.value)}
                className="flex-1 max-w-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {anneesAcademiques
                  .sort((a, b) => b.libelle.localeCompare(a.libelle))
                  .map((annee) => (
                    <option key={annee.id} value={annee.libelle}>
                      {annee.libelle}
                    </option>
                  ))}
              </select>
              <div className="text-sm text-gray-500 italic">
                Comparaison avec {g.annee_precedente}
              </div>
            </div>
          </div>
        </div>

        {/* Cartes résumé */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-5xl font-bold text-red-600">{g.taux_abandon_pourcent}%</div>
            <div className="text-gray-600 mt-2">Taux global</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-5xl font-bold text-gray-700">{g.total_n1}</div>
            <div className="text-gray-600 mt-2">Étudiants ≥ L2 (N-1)</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-5xl font-bold text-green-600">{g.reinscrits}</div>
            <div className="text-gray-600 mt-2">Réinscrits</div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-5xl font-bold text-red-700">{g.abandons}</div>
            <div className="text-gray-600 mt-2">Abandons</div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mb-8 italic">
          Comparaison : {g.annee_precedente} → {g.annee_cible} | L1 exclue du calcul
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Par parcours */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-red-900">Par parcours</h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: par_parcours.map(p => p.libelle),
                  datasets: [{
                    label: "Taux d'abandon (%)",
                    data: par_parcours.map(p => p.taux_abandon_pourcent),
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                  }]
                }}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Par filière */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-red-900">Par filière</h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: par_filiere.map(f => f.nom),
                  datasets: [{
                    label: "Taux d'abandon (%)",
                    data: par_filiere.map(f => f.taux_abandon_pourcent),
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                  }]
                }}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Par année d'étude */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-red-900">Par année d'étude</h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: par_annee_etude.map(a => a.libelle),
                  datasets: [{
                    label: "Taux d'abandon (%)",
                    data: par_annee_etude.map(a => a.taux_abandon_pourcent),
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                  }]
                }}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Tableau détaillé par parcours */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-red-900">Détail par parcours</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base N-1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réinscrits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {par_parcours.map((p, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.libelle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.total_n1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{p.total_n1 - p.abandons}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{p.abandons}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${
                        p.taux_abandon_pourcent > 30 ? 'bg-red-100 text-red-800' : 
                        p.taux_abandon_pourcent > 15 ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {p.taux_abandon_pourcent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau détaillé par filière */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-red-900">Détail par filière</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filière</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base N-1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Réinscrits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {par_filiere.map((f, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.total_n1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{f.total_n1 - f.abandons}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{f.abandons}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${
                        f.taux_abandon_pourcent > 30 ? 'bg-red-100 text-red-800' : 
                        f.taux_abandon_pourcent > 15 ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {f.taux_abandon_pourcent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}