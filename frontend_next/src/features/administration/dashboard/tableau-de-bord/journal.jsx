"use client";
import React, { useEffect, useState, useMemo } from "react";
import { FaUserShield, FaClock } from "react-icons/fa";
import JournalService from "@/services/journalService";

export default function JournalActions() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await JournalService.getJournalActions();
        setLogs(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Erreur chargement journal :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filtrage par recherche
  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        log.utilisateur?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.objet?.toLowerCase().includes(search.toLowerCase()) ||
        log.statut?.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <p className="text-center text-gray-500 italic mt-4">
        Chargement du journal...
      </p>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mt-6">
      <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-gray-800">
        <FaUserShield className="text-orange-600 text-2xl" />
        Journal des actions
      </h2>

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par utilisateur, action, objet ou statut..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // reset page quand on recherche
          }}
          className="w-full md:w-1/2 p-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-0">
          <thead className="bg-gray-50">
            <tr>
              {["Utilisateur", "Action", "Objet", "Date", "IP", "Résultat"].map(
                (title) => (
                  <th
                    key={title}
                    className="px-4 py-3 text-gray-700 font-semibold text-left text-sm uppercase tracking-wider"
                  >
                    {title}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-400 italic">
                  Aucun historique trouvé.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-4 py-3 text-gray-700">{log.utilisateur}</td>
                  <td className="px-4 py-3 text-gray-600">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600">{log.objet}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    {new Date(log.date_action).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.ip}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        log.statut === "SUCCES"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.statut}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Préc
          </button>
          <span className="px-3 py-1 text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Suiv
          </button>
        </div>
      )}
    </div>
  );
}
