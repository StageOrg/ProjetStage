"use client";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
// Importez votre nouveau service
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
      
      // Essayer d'abord de récupérer avec les notes
      try {
        const data = await etudiantNotesService.getMyUEsWithNotes();
        const organizedData = organizeDataBySemester(data);
        setUesData(organizedData);
      } catch (notesError) {
        console.warn('Erreur avec notes, tentative sans notes:', notesError.message);
        
        // Fallback : récupérer seulement les UEs sans notes
        try {
          const data = await etudiantNotesService.getMyUEsOnly();
          const organizedData = organizeDataBySemester(data);
          setUesData(organizedData);
          
          // Afficher un avertissement que les notes ne sont pas disponibles
          console.info('UEs chargées sans les notes');
        } catch (uesError) {
          throw new Error(`Impossible de charger les données: ${uesError.message}`);
        }
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
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

    // Convertir en array et trier
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
      case 'En cours': return "text-blue-600";
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
    <div className="w-full  mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mes résultats : Licence Professionnelle en Sciences de l'Ingénieur</h1>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3">Code</th>
              <th scope="col" className="px-4 py-3">Libellé</th>
              <th scope="col" className="px-4 py-3">Semestre</th>
              <th scope="col" className="px-4 py-3 text-center">Crédit validé</th>
              <th scope="col" className="px-4 py-3 text-center">Moyenne</th>
              <th scope="col" className="px-4 py-3 text-center">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {uesData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  Aucune donnée disponible
                </td>
              </tr>
            ) : (
              uesData.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {/* En-tête de groupe - exactement comme votre version originale */}
                  <tr className="bg-blue-50">
                    <td colSpan="6" className="px-4 py-2 font-semibold">
                      {group.semestre}
                    </td>
                  </tr>
                  
                  {/* UEs du groupe - exactement comme votre version originale */}
                  {group.ues.map((ue, ueIndex) => (
                    <tr key={`${groupIndex}-${ueIndex}`} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{ue.code}</td>
                      <td className="px-4 py-3">{ue.libelle}</td>
                      <td className="px-4 py-3">{group.semestre}</td>
                      <td className="px-4 py-3 text-center">{ue.creditValide}</td>
                      <td className="px-4 py-3 text-center">
                        {ue.moyenne !== null ? ue.moyenne.toFixed(2) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-center font-medium ${getStatusColor(ue.statut)}`}>
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