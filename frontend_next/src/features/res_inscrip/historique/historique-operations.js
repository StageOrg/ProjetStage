"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { FaHistory, FaUserPlus, FaTrashAlt, FaEye, FaEyeSlash, FaFilter } from "react-icons/fa";

export default function HistoriqueOperations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMdp, setShowMdp] = useState({});

  const [anneeFilter, setAnneeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [toutesLesAnnees, setToutesLesAnnees] = useState([]);

  // Charger les années académiques depuis le backend
  useEffect(() => {
    const chargerAnneesAcademiques = async () => {
      try {
        // Essayer d'abord l'endpoint avec cache
        try {
          const res = await api.get('/inscription/annees-academiques-cached/');
          const annees = res.data.annees || res.data || [];
          setToutesLesAnnees(annees);
        } catch (err) {
          // Fallback sur endpoint classique
          console.log("Endpoint cached non disponible, fallback sur endpoint classique");
          const res = await api.get('/inscription/annee-academique/');
          const annees = res.data.results || res.data || [];
          setToutesLesAnnees(annees);
        }
      } catch (err) {
        console.error("Erreur chargement années académiques:", err);
      }
    };

    chargerAnneesAcademiques();
  }, []);

  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        const params = new URLSearchParams();
        if (anneeFilter) params.append("annee", anneeFilter);
        if (typeFilter === "creation") params.append("type", "creation");
        if (typeFilter === "suppression") params.append("type", "suppression");

        const res = await api.get(`/inscription/historique-operations/?${params.toString()}`);
        const historique = res.data.historique || [];

        setData(historique);
      } catch (err) {
        console.error("Erreur chargement historique:", err);
      } finally {
        setLoading(false);
      }
    };

    chargerDonnees();
  }, [anneeFilter, typeFilter]);

  const toggleMdp = (index) => {
    setShowMdp(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-100 py-8 mb-8">
        <div className="max-w-screen-2xl mx-auto px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-4">
            <FaHistory className="text-blue-700" size={30} />
            Historique des opérations
          </h1>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="bg-white border border-gray-200 p-6 mb-8 flex flex-wrap items-center gap-6">
          <select
            value={anneeFilter}
            onChange={e => setAnneeFilter(e.target.value)}
            className="px-5 py-3 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg"
          >
            <option value="">Toutes les années académiques</option>
            {toutesLesAnnees.map(annee => (
              <option key={annee.id ?? annee.libelle} value={annee.libelle ?? annee.annee}>
                {annee.libelle ?? annee.annee}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-5 py-3 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-lg"
          >
            <option value="">Toutes les opérations</option>
            <option value="creation">Créations seulement</option>
            <option value="suppression">Suppressions seulement</option>
          </select>
        </div>

        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100 text-gray-800 font-semibold">
                <tr>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-left">Par</th>
                  <th className="px-4 py-4 text-left">Action</th>
                  <th className="px-4 py-4 text-left">Nom complet</th>
                  <th className="px-4 py-4 text-left">Email</th>
                  <th className="px-4 py-4 text-left">Username</th>
                  <th className="px-4 py-4 text-center">Mot de passe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500 text-lg">
                      Aucune opération trouvée avec ces filtres
                    </td>
                  </tr>
                ) : (
                  data.map((e, i) => (
                    <tr key={i} className={`hover:bg-gray-50 transition ${e.is_suppression ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 text-gray-700">{e.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{e.cree_par}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2  font-bold ${e.is_suppression ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {e.is_suppression ? <FaTrashAlt /> : <FaUserPlus />}
                          {e.operation}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${e.is_suppression ? 'text-red-700' : 'text-gray-900'}`}>
                        {e.nom} {e.prenom}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{e.email || "-"}</td>
                      <td className="px-6 py-4 font-mono text-gray-700">{e.username || "-"}</td>
                                 
                        <td className="px-6 py-4 text-center">
                        {e.mdp_temp ? (
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-mono tracking-wider text-sm">
                              {showMdp[i] ? e.mdp_temp : "••••••••"}
                            </span>
                            <button onClick={() => toggleMdp(i)} className="text-gray-500 hover:text-gray-800 transition">
                              {showMdp[i] ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t text-center text-gray-700 font-medium">
            {data.length} opération{data.length > 1 ? 's' : ''} affichée{data.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
