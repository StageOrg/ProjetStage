// frontend_next/src/features/etudiant/dashboard/statistiques/Statistiques.js
"use client";
import React, { useState, useEffect } from "react";
import { 
  FaCheckCircle, FaChartBar, FaMedal, FaStar, 
  FaTrophy, FaSpinner, FaGraduationCap, FaClipboardList 
} from "react-icons/fa";
import etudiantStatsService from "@/services/etudiants/etudiantStatsService";

export default function Statistiques() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsData = await etudiantStatsService.calculateMyStats();
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
      setError("Erreur lors du chargement de vos statistiques");
    } finally {
      setLoading(false);
    }
  };

  const getMoyenneColor = (moyenne) => {
    if (moyenne >= 16) return "text-green-700";
    if (moyenne >= 14) return "text-green-600";
    if (moyenne >= 12) return "text-blue-600";
    if (moyenne >= 10) return "text-orange-600";
    if (moyenne > 0) return "text-red-600";
    return "text-gray-500";
  };

  const getMoyenneBackground = (moyenne) => {
    if (moyenne >= 16) return "from-green-100 to-green-200";
    if (moyenne >= 14) return "from-green-50 to-green-100";
    if (moyenne >= 12) return "from-blue-50 to-blue-100";
    if (moyenne >= 10) return "from-orange-50 to-orange-100";
    if (moyenne > 0) return "from-red-50 to-red-100";
    return "from-gray-50 to-gray-100";
  };

  const getProgressionColor = (pourcentage) => {
    if (pourcentage >= 80) return "bg-green-600";
    if (pourcentage >= 60) return "bg-blue-600";
    if (pourcentage >= 40) return "bg-orange-600";
    return "bg-red-600";
  };

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          <span className="ml-3 text-lg text-black">Calcul de vos statistiques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
        <div className="text-center text-black">
          <p className="text-lg">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
      <h2 className="flex items-center gap-3 text-3xl font-extrabold text-black mb-8 drop-shadow justify-center">
        <FaChartBar className="text-blue-700 text-3xl" /> 
        Statistiques personnelles
      </h2>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        
        {/* UEs validées */}
        <div className="flex flex-col items-center p-6 bg-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-4">
            <FaCheckCircle className="text-3xl text-green-600" />
          </div>
          <span className="text-4xl font-extrabold text-black">{stats?.uesValidees || 0}</span>
          <span className="text-black text-center font-medium">UE validées</span>
          <span className="text-xs text-black mt-1">
            / {stats?.nombreUEsInscrites || 0} inscrites
          </span>
        </div>

        {/* Crédits obtenus */}
        <div className="flex flex-col items-center p-6 bg-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
            <FaStar className="text-3xl text-blue-600" />
          </div>
          <span className="text-4xl font-extrabold text-black">{stats?.creditsObtenus || 0}</span>
          <span className="text-black text-center font-medium">Crédits obtenus</span>
          <span className="text-xs text-black mt-1">
            / {stats?.totalCredits || 0} possibles
          </span>
        </div>

        {/* Moyenne générale */}
        <div className="flex flex-col items-center p-6 bg-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getMoyenneBackground(stats?.moyenneGenerale || 0)} rounded-full mb-4`}>
            <FaMedal className="text-3xl text-orange-500" />
          </div>
          <span className={`text-4xl font-extrabold ${getMoyenneColor(stats?.moyenneGenerale || 0)}`}>
            {stats?.moyenneGenerale || 0}
          </span>
          <span className="text-black text-center font-medium">Moyenne générale</span>
          <span className="text-xs text-black mt-1">/ 20</span>
        </div>

        {/* UEs avec notes */}
        <div className="flex flex-col items-center p-6 bg-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mb-4">
            <FaClipboardList className="text-3xl text-purple-600" />
          </div>
          <span className="text-4xl font-extrabold text-black">{stats?.nombreUEsAvecNotes || 0}</span>
          <span className="text-black text-center font-medium">UEs notées</span>
          <span className="text-xs text-black mt-1">Évaluations disponibles</span>
        </div>
      </div>

      {/* Informations supplémentaires */}
      {stats?.moyenneGenerale > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Détails numériques */}
          <div className="bg-gray-200 rounded-2xl shadow-lg p-8 backdrop-blur">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-3">
              <FaChartBar className="text-blue-600 text-2xl" />
              Détails
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-300 rounded-lg">
                <span className="text-black">UEs inscrites</span>
                <span className="font-bold text-black">{stats?.nombreUEsInscrites || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-300 rounded-lg">
                <span className="text-black">UEs évaluées</span>
                <span className="font-bold text-black">{stats?.nombreUEsAvecNotes || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-300 rounded-lg">
                <span className="text-black">Taux de réussite</span>
                <span className="font-bold text-black">
                  {stats?.totalCredits > 0 
                    ? Math.round((stats?.creditsObtenus / stats?.totalCredits) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-300 rounded-lg">
                <span className="text-black">Crédits restants</span>
                <span className="font-bold text-black">
                  {(stats?.totalCredits || 0) - (stats?.creditsObtenus || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className="mt-10 bg-gray-200 rounded-2xl shadow-lg p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black flex items-center gap-2">
            <FaGraduationCap className="text-blue-600" />
            Progression académique
          </h3>
          <span className="text-2xl font-bold text-black">
            {stats?.progressionPourcentage || 0}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
          <div 
            className={`h-6 rounded-full transition-all duration-1000 ease-out ${getProgressionColor(stats?.progressionPourcentage || 0)}`}
            style={{ width: `${stats?.progressionPourcentage || 0}%` }}
          >
            <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-sm text-black">
          <span>Crédits validés : {stats?.creditsObtenus || 0}</span>
          <span>Objectif : {stats?.totalCredits || 0} crédits</span>
        </div>
      </div>
    </div>
  );   
}