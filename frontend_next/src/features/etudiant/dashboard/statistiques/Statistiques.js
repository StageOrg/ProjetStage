// frontend_next/src/features/etudiant/dashboard/statistiques/Statistiques.js
"use client";
import React, { useState, useEffect } from "react";
import { 
  FaCheckCircle, FaChartBar, FaMedal, FaStar, 
  FaTrophy, FaSpinner, FaGraduationCap, FaClipboardList 
} from "react-icons/fa";
import etudiantDashboardService from "@/services/etudiants/etudiantDashboardService";

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
      const statsData = await etudiantDashboardService.calculateMyStats();
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
          <span className="ml-3 text-lg text-gray-600">Calcul de vos statistiques...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
        <div className="text-center text-red-600">
          <p className="text-lg">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
      <h2 className="flex items-center gap-3 text-3xl font-extrabold text-blue-900 mb-8 drop-shadow justify-center">
        <FaChartBar className="text-blue-700 text-3xl" /> 
        Statistiques personnelles
      </h2>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        
        {/* UEs validées */}
        <div className="flex flex-col items-center p-6 bg-white/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-4">
            <FaCheckCircle className="text-3xl text-green-600" />
          </div>
          <span className="text-4xl font-extrabold text-green-700">{stats?.uesValidees || 0}</span>
          <span className="text-gray-600 text-center font-medium">UE validées</span>
          <span className="text-xs text-gray-500 mt-1">
            / {stats?.nombreUEsInscrites || 0} inscrites
          </span>
        </div>

        {/* Crédits obtenus */}
        <div className="flex flex-col items-center p-6 bg-white/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-4">
            <FaStar className="text-3xl text-blue-600" />
          </div>
          <span className="text-4xl font-extrabold text-blue-700">{stats?.creditsObtenus || 0}</span>
          <span className="text-gray-600 text-center font-medium">Crédits obtenus</span>
          <span className="text-xs text-gray-500 mt-1">
            / {stats?.totalCredits || 0} possibles
          </span>
        </div>

        {/* Moyenne générale */}
        <div className="flex flex-col items-center p-6 bg-white/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getMoyenneBackground(stats?.moyenneGenerale || 0)} rounded-full mb-4`}>
            <FaMedal className="text-3xl text-orange-500" />
          </div>
          <span className={`text-4xl font-extrabold ${getMoyenneColor(stats?.moyenneGenerale || 0)}`}>
            {stats?.moyenneGenerale || 0}
          </span>
          <span className="text-gray-600 text-center font-medium">Moyenne générale</span>
          <span className="text-xs text-gray-500 mt-1">/ 20</span>
        </div>

        {/* UEs avec notes */}
        <div className="flex flex-col items-center p-6 bg-white/60 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full mb-4">
            <FaClipboardList className="text-3xl text-purple-600" />
          </div>
          <span className="text-4xl font-extrabold text-purple-700">{stats?.nombreUEsAvecNotes || 0}</span>
          <span className="text-gray-600 text-center font-medium">UEs notées</span>
          <span className="text-xs text-gray-500 mt-1">Évaluations disponibles</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-white/60 rounded-2xl shadow-lg p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaGraduationCap className="text-blue-600" />
            Progression académique
          </h3>
          <span className="text-2xl font-bold text-blue-700">
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
        
        <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
          <span>Crédits validés : {stats?.creditsObtenus || 0}</span>
          <span>Objectif : {stats?.totalCredits || 0} crédits</span>
        </div>

        {/* Message de motivation */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center font-medium">
            {stats?.progressionPourcentage >= 80 
              ? "🎉 Excellente progression ! Continue comme ça !" 
              : stats?.progressionPourcentage >= 50 
              ? "💪 Bon travail ! Tu es sur la bonne voie !"
              : stats?.progressionPourcentage > 0
              ? "🌟 C'est un bon début, continue tes efforts !"
              : "📚 Commence tes évaluations pour voir ta progression !"}
          </p>
        </div>
      </div>

      {/* Informations supplémentaires */}
      {stats?.moyenneGenerale > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Appréciation */}
          <div className="bg-white/60 rounded-2xl shadow-lg p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FaTrophy className="text-yellow-600" />
              Appréciation
            </h3>
            <div className="text-center">
              <div className={`text-6xl mb-3 ${getMoyenneColor(stats?.moyenneGenerale)}`}>
                {stats?.moyenneGenerale >= 16 ? "🏆" : 
                 stats?.moyenneGenerale >= 14 ? "🥇" :
                 stats?.moyenneGenerale >= 12 ? "🥈" :
                 stats?.moyenneGenerale >= 10 ? "🥉" : "📚"}
              </div>
              <div className={`text-lg font-bold mb-2 ${getMoyenneColor(stats?.moyenneGenerale)}`}>
                {stats?.moyenneGenerale >= 16 ? "Excellent !" : 
                 stats?.moyenneGenerale >= 14 ? "Très bien" :
                 stats?.moyenneGenerale >= 12 ? "Bien" :
                 stats?.moyenneGenerale >= 10 ? "Assez bien" : "À améliorer"}
              </div>
              <p className="text-sm text-gray-600">
                {stats?.moyenneGenerale >= 16 ? "Résultats exceptionnels, continuez !" : 
                 stats?.moyenneGenerale >= 14 ? "Très bon niveau, bravo !" :
                 stats?.moyenneGenerale >= 12 ? "Bon travail, c'est encourageant !" :
                 stats?.moyenneGenerale >= 10 ? "Vous êtes sur la bonne voie !" : 
                 "Il faut redoubler d'efforts !"}
              </p>
            </div>
          </div>

          {/* Détails numériques */}
          <div className="bg-white/60 rounded-2xl shadow-lg p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartBar className="text-blue-600" />
              Détails
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">UEs inscrites</span>
                <span className="font-bold text-blue-600">{stats?.nombreUEsInscrites || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">UEs évaluées</span>
                <span className="font-bold text-purple-600">{stats?.nombreUEsAvecNotes || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Taux de réussite</span>
                <span className="font-bold text-green-600">
                  {stats?.nombreUEsAvecNotes > 0 
                    ? Math.round((stats?.uesValidees / stats?.nombreUEsAvecNotes) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Crédits restants</span>
                <span className="font-bold text-orange-600">
                  {(stats?.totalCredits || 0) - (stats?.creditsObtenus || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}