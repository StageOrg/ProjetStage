"use client";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";
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

      // Garder uniquement les UEs avec notes
      const filteredData = organizedData.map((group) => ({
        ...group,
        ues: group.ues.filter((ue) => ue.moyenne !== null),
      }));

      setUesData(filteredData);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setError(
        err?.message || "Erreur lors du chargement de vos UEs et notes"
      );
    } finally {
      setLoading(false);
    }
  };

  const organizeDataBySemester = (data) => {
    const grouped = {};

    data.forEach((ue) => {
      const semestreKey = ue.semestre;
      if (!grouped[semestreKey]) grouped[semestreKey] = [];
      grouped[semestreKey].push(ue);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semestre, ues]) => ({
        semestre,
        ues: ues.sort((a, b) => a.code.localeCompare(b.code)),
      }));
  };

  const getStatusColor = (statut) => {
    switch (statut) {
  case "Validé":
    return "text-blue-600 bg-blue-50";
  case "Non Validé":
    return "text-red-600 bg-red-50";
  default:
    return "text-red-600 bg-red-50";
}

  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3 text-gray-700">
          <FaSpinner className="animate-spin text-3xl text-blue-600" />
          <span className="text-lg font-medium">
            Chargement de vos UEs et notes...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
        <p className="text-red-600 text-lg font-medium mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <motion.h1
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-extrabold text-gray-800 mb-10 text-center"
      >
        Mes Notes
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-x-auto shadow-lg rounded-2xl bg-white"
      >
        <table className="w-full text-sm md:text-base text-gray-700 border-collapse">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-50 text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Libellé</th>
              <th className="px-6 py-4 text-left">Semestre</th>
              <th className="px-6 py-4 text-center">Crédit</th>
              <th className="px-6 py-4 text-center">Moyenne</th>
              <th className="px-6 py-4 text-center">Résultat</th>
            </tr>
          </thead>
          <tbody>
            {uesData.length === 0 ||
            uesData.every((group) => group.ues.length === 0) ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-500 text-lg"
                >
                  Aucune note disponible pour le moment.
                </td>
              </tr>
            ) : (
              uesData.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  <tr className="bg-blue-50/70">
                    <td
                      colSpan="6"
                      className="px-6 py-4 font-semibold text-blue-800 text-lg border-t"
                    >
                      {group.semestre}
                    </td>
                  </tr>
                  {group.ues.map((ue, ueIndex) => (
                    <motion.tr
                      key={`${groupIndex}-${ueIndex}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ueIndex * 0.05 }}
                      className="border-b hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {ue.code}
                      </td>
                      <td className="px-6 py-3">{ue.libelle}</td>
                      <td className="px-6 py-3">{group.semestre}</td>
                      <td className="px-6 py-3 text-center">
                          {ue.statut === "Validé"
                          ? ue.creditValide ?? ue.credits
                          : ue.credits ?? "-"}
                      </td>

                      <td className="px-6 py-3 text-center font-semibold">
                        {ue.moyenne !== null ? ue.moyenne.toFixed(2) : "-"}
                      </td>
                      <td
                        className={`px-6 py-3 text-center font-medium rounded-full ${getStatusColor(
                          ue.statut
                        )}`}
                      >
                        {ue.statut}
                      </td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
