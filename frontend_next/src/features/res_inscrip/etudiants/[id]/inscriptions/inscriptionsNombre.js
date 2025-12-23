"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import { FaCalendarAlt, FaUniversity, FaBook, FaClock, FaEye, FaSync, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";

export default function InscriptionsEtudiant() {
  const { id } = useParams();
  const router = useRouter();
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchInscriptions = async () => {
      setLoading(true);
      try {
        const data = await etudiantService.getInscriptions(id);
        setInscriptions(data || []);
      } catch (err) {
        console.error("Erreur chargement inscriptions:", err);
        toast.error("Impossible de charger les inscriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchInscriptions();
  }, [id]);

  const voirDetails = (inscriptionId) => {
    router.push(`/inscriptions/${inscriptionId}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Bouton Retour */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FaArrowLeft />
          <span className="font-medium">Précédent</span>
        </button>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <FaCalendarAlt className="text-blue-600" />
            Historique des inscriptions
          </h1>
          {!loading && (
            <p className="text-gray-600 mt-2 ml-11">
              <strong>{inscriptions.length}</strong> inscription{inscriptions.length > 1 ? "s" : ""} trouvée{inscriptions.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* États : Chargement / Vide / Liste */}
        {loading ? (
          <div className="bg-white p-16 rounded-xl shadow text-center">
            <FaSync className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Chargement des inscriptions...</p>
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="bg-white p-16 rounded-xl shadow text-center">
            <p className="text-xl text-gray-500">Aucune inscription trouvée pour cet étudiant.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inscriptions.map((ins) => (
              <div
                key={ins.id}
                className="bg-white p-6 rounded-xl shadow hover:shadow-lg border border-gray-200 hover:border-blue-400 transition-all duration-300"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {ins.annee_academique}
                  </h3>
                </div>

                <div className="space-y-4 text-gray-700 mb-6">
                  <div className="flex items-center gap-3">
                    <FaUniversity className="text-blue-600 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Filière</p>
                      <p className="font-medium">{ins.filiere}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaBook className="text-blue-600 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Parcours</p>
                      <p className="font-medium">{ins.parcours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaClock className="text-blue-600 text-lg" />
                    <div>
                      <p className="text-sm text-gray-500">Année d'étude</p>
                      <p className="font-medium">{ins.annee_etude}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => voirDetails(ins.id)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                >
                  <FaEye />
                  Voir les détails
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}