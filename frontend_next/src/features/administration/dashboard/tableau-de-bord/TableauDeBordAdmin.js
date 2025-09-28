"use client";

import React, { useState, useEffect } from "react";
import { FaTachometerAlt, FaSpinner, FaUsers, FaChalkboardTeacher, FaBook } from "react-icons/fa";
import DashboardService from "@/services/administrationService";

// Hook personnalisé pour la récupération des données
function useDashboardStats() {
  const [stats, setStats] = useState({
    etudiants: 0,
    professeurs: 0,
    ues: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await DashboardService.getDashboardStats();
      
      if (data.error) {
        setError(data.error);
      }
      
      setStats(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données');
      console.error('Erreur dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

// Composant pour chaque carte statistique
function StatCard({ value, label, color, icon: Icon, loading }) {
  return (
    <div className="flex flex-col items-center p-7 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      {loading ? (
        <div className="flex items-center justify-center h-16">
          <FaSpinner className="animate-spin text-gray-400 text-2xl" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2">
            <Icon className={`text-3xl ${color}`} />
            <span className={`text-4xl font-bold ${color}`}>
              {value.toLocaleString('fr-FR')}
            </span>
          </div>
          <span className="text-gray-600 text-sm font-medium">{label}</span>
        </>
      )}
    </div>
  );
}

export default function TableauDeBordAdmin() {
  const { stats, loading, error, refetch } = useDashboardStats();

  // Configuration des 3 cartes essentielles
  const statCards = [
    { 
      key: 'etudiants', 
      value: stats.etudiants, 
      label: 'Étudiants', 
      color: 'text-teal-700',
      icon: FaUsers
    },
    { 
      key: 'professeurs', 
      value: stats.professeurs, 
      label: 'Enseignants', 
      color: 'text-orange-700',
      icon: FaChalkboardTeacher
    },
    { 
      key: 'ues', 
      value: stats.ues, 
      label: 'UEs', 
      color: 'text-blue-700',
      icon: FaBook
    }
  ];

  return (
    <div className="bg-white backdrop-blur-md  px-8 py-10 w-full  animate-fade-in">
      {/* En-tête simple */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-teal-900">
          <FaTachometerAlt className="text-teal-700" />
          Tableau de bord
        </h2>
        
        {/* Indicateur de statut */}
        <div className="text-sm text-gray-500">
          {loading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <FaSpinner className="animate-spin" />
              Chargement...
            </div>
          ) : error ? (
            <span className="text-red-500 font-medium"> Erreur</span>
          ) : (
            <span className="text-green-600">
               Mis à jour à {new Date().toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-red-700 font-medium">Erreur de chargement</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button 
                onClick={refetch}
                className="text-red-700 underline text-sm mt-2 hover:text-red-800"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grille des 3 statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            value={card.value}
            label={card.label}
            color={card.color}
            icon={card.icon}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}