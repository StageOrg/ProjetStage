"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import etudiantService from "@/services/etudiants/GestionEtudiantAdminService";
import { FaCalendarAlt, FaUniversity, FaBook, FaClock, FaEye, FaSync , FaArrowLeft } from "react-icons/fa";


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
        alert("Impossible de charger les inscriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchInscriptions();
  }, [id]);

  const voirDetails = (inscriptionId) => {
    router.push(`/inscriptions/${inscriptionId}`);
  };

  return (
  
    <div className="p-3 ">
     
      <div className="max-w-3xl mx-auto">
        
        {/* Titre */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 flex gap-2">
            <FaCalendarAlt className="text-blue-600" />
            Historique des inscriptions
          </h1>
          <p className="text-gray-600 mt-2">
            {!loading && (
              <>
                <strong>{inscriptions.length}</strong> inscription{inscriptions.length > 1 ? "s" : ""} trouvée{inscriptions.length > 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        {/* États : Chargement / Vide / Liste */}
        {loading ? (
          <div className="bg-white p-16 rounded-xl shadow text-center">
            <FaSync className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Chargement des inscriptions...</p>
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="bg-white p-16 rounded-xl shadow text-center">
            <div className="text-2xl text-gray-300 mb-4">pas d'inscription</div>
            <p className="text-xl text-gray-500">Aucune inscription trouvée pour cet étudiant.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {inscriptions.map((ins) => (
              <div
                key={ins.id}
                className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {ins.annee_academique}
                  </h3>
                </div>

                <div className="space-y-3 text-gray-700 mb-10">
                  <p className="flex items-center gap-3">
                    <FaUniversity className="text-blue-600 text-lg" />
                    <span><strong>Filière :</strong> {ins.filiere}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <FaBook className="text-green-600 text-lg" />
                    <span><strong>Parcours :</strong> {ins.parcours}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <FaClock className="text-purple-600 text-lg" />
                    <span><strong>Année :</strong> {ins.annee_etude}</span>
                  </p>
                </div>

                <button
                  onClick={() => voirDetails(ins.id)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                >
                  <FaEye />
                  Voir les détails complets
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}