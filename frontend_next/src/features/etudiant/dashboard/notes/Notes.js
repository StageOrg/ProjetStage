"use client";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import etudiantNotesService from "@/services/etudiants/etudiantNotesService";

export default function UEsNotes() {
  const [uesData, setUesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await etudiantNotesService.getMyUEsWithNotes();
      const organizedData = organizeDataBySemester(data);
      // Filtrer pour ne garder que les UEs avec notes disponibles
      const filteredData = organizedData.map(group => ({
        ...group,
        ues: group.ues.filter(ue => ue.moyenne !== null)
      }));
      setUesData(filteredData);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setError(err.message || "Erreur lors du chargement de vos UEs et notes");
    } finally {
      setLoading(false);
    }
  };

  const organizeDataBySemester = (data) => {
    const grouped = {};

    data.forEach(ue => {
      const semestreKey = ue.semestre;
      if (!grouped[semestreKey]) {
        grouped[semestreKey] = [];
      }
      grouped[semestreKey].push(ue);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semestre, ues]) => ({
        semestre,
        ues: ues.sort((a, b) => a.code.localeCompare(b.code))
      }));
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'Validé': return "text-green-600";
      case 'Non Validé': return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center">
          <FaSpinner className="animate-spin text-2xl text-blue-600" />
          <span className="ml-3 text-gray-600">Chargement de vos UEs et notes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mes Notes</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-gray-700 border-collapse">
          <thead className="text-sm text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-8 py-6">Code</th>
              <th scope="col" className="px-8 py-6">Libellé</th>
              <th scope="col" className="px-8 py-6">Semestre</th>
              <th scope="col" className="px-8 py-6 text-center">Crédit validé</th>
              <th scope="col" className="px-8 py-6 text-center">Moyenne</th>
              <th scope="col" className="px-8 py-6 text-center">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {uesData.length === 0 || uesData.every(group => group.ues.length === 0) ? (
              <tr>
                <td colSpan="6" className="px-8 py-10 text-center text-gray-500 text-lg">
                  Aucune donnée avec notes disponibles
                </td>
              </tr>
            ) : (
              uesData.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  <tr className="bg-blue-50">
                    <td colSpan="6" className="px-8 py-4 font-semibold text-lg">
                      {group.semestre}
                    </td>
                  </tr>
                  {group.ues.map((ue, ueIndex) => (
                    <tr key={`${groupIndex}-${ueIndex}`} className="bg-white border-b hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-4 font-medium">{ue.code}</td>
                      <td className="px-8 py-4">{ue.libelle}</td>
                      <td className="px-8 py-4">{group.semestre}</td>
                      <td className="px-8 py-4 text-center">{ue.creditValide}</td>
                      <td className="px-8 py-4 text-center">
                        {ue.moyenne !== null ? ue.moyenne.toFixed(2) : '-'}
                      </td>
                      <td className={`px-8 py-4 text-center font-medium ${getStatusColor(ue.statut)}`}>
                        {ue.statut}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}