"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import { FaCalendarAlt, FaUniversity, FaBook, FaClock } from "react-icons/fa";

export default function InscriptionsEtudiant() {
  const { id } = useParams();
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState(null);
  const [ues, setUes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    etudiantService.getInscriptions(id).then((data) => {
      setInscriptions(data || []);
    });
  }, [id]);

  const voirUEs = async (inscriptionId) => {
    if (selectedInscription === inscriptionId) return;
    setLoading(true);
    setSelectedInscription(inscriptionId);
    try {
      const data = await etudiantService.getUEsInscription(inscriptionId);
      setUes(data || []);
    } catch (err) {
      console.error("Erreur UEs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        {/* Titre principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaCalendarAlt className="text-blue-600" />
            Historique des inscriptions
          </h1>
          <p className="text-gray-600 mt-2">
            <strong>{inscriptions.length}</strong> inscription{inscriptions.length > 1 ? "s" : ""} trouvée{inscriptions.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Liste des inscriptions */}
        {inscriptions.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow text-center text-gray-500">
            Aucune inscription trouvée pour cet étudiant.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {inscriptions.map((ins) => (
              <div
                key={ins.id}
                onClick={() => voirUEs(ins.id)}
                className={`bg-white p-6 rounded-xl shadow-md cursor-pointer transition-all duration-200 border-2 ${
                  selectedInscription === ins.id
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800">
                    {ins.annee_academique}
                  </h3>
                  {selectedInscription === ins.id && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Sélectionnée
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <FaUniversity className="text-blue-500" />
                    <strong>Filière :</strong> {ins.filiere}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaBook className="text-green-500" />
                    <strong>Parcours :</strong> {ins.parcours}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaClock className="text-purple-500" />
                    <strong>Année :</strong> {ins.annee_etude}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tableau des UEs */}
        {selectedInscription && (
          <div className="mt-10 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaBook className="inline" />
                Unités d'Enseignement (UEs) sélectionnées
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="inline-block animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-2">Chargement des UEs...</p>
              </div>
            ) : ues.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune UE sélectionnée pour cette inscription.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Code</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-700">Libellé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ues.map((ue) => (
                      <tr key={ue.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-blue-600 font-semibold">
                          {ue.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {ue.libelle}
                        </td>
                       
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}