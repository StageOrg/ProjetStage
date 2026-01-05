"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import { ArrowLeft, Calendar, BookOpen, GraduationCap, Building2, FileText } from "lucide-react";

export default function DetailInscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const inscriptionId = params.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inscriptionId) return;

    api
      .get(`/inscription/inscriptions/${inscriptionId}/detail/`)
      .then((res) => {
        console.log("✅ Données reçues:", res.data);
        console.log("📚 Nombre d'UEs:", res.data.ues?.length);
        console.log("📋 Détail UEs:", res.data.ues);
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Erreur complète:", err);
        console.error("❌ Response:", err.response?.data);
        setError("Impossible de charger les détails de l'inscription");
        setLoading(false);
      });
  }, [inscriptionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <strong>Erreur :</strong> {error || "Données indisponibles"}
          </div>
        </div>
      </div>
    );
  }

  const { inscription, ues, statistiques } = data;

  // Grouper les UEs par semestre
  const uesParSemestre = ues.reduce((acc, ue) => {
    const semestreLabel = ue.semestre?.libelle || "Sans semestre";
    if (!acc[semestreLabel]) {
      acc[semestreLabel] = [];
    }
    acc[semestreLabel].push(ue);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-teal-700 hover:text-teal-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour</span>
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Détails de l'inscription
              </h1>
              <p className="text-gray-600 mt-1">
                N° {inscription.numero} - {inscription.annee_academique.libelle}
              </p>
            </div>
            
            {inscription.annee_academique.est_active && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Année active
              </span>
            )}
          </div>
        </div>

        {/* Cartes d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Année académique */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-teal-500">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-teal-600" />
              <h3 className="font-semibold text-gray-700">Année académique</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {inscription.annee_academique.libelle}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Inscrit le {new Date(inscription.date_inscription).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Parcours */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Parcours</h3>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {inscription.parcours.libelle}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {inscription.annee_etude.libelle}
            </p>
          </div>

          {/* Filière */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Filière</h3>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {inscription.filiere.nom}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {inscription.filiere.departement.nom}
            </p>
          </div>

          {/* Statistiques UEs */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-700">UEs inscrites</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {statistiques.nombre_ues} UEs
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {statistiques.total_credits} crédits
            </p>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" />
            Informations complètes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Formation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Établissement :</span>
                  <span className="font-medium">{inscription.filiere.departement.etablissement.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Département :</span>
                  <span className="font-medium">{inscription.filiere.departement.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Filière :</span>
                  <span className="font-medium">{inscription.filiere.nom}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Cursus</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Parcours :</span>
                  <span className="font-medium">{inscription.parcours.libelle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Niveau :</span>
                  <span className="font-medium">{inscription.annee_etude.libelle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">N° inscription :</span>
                  <span className="font-medium">{inscription.numero}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des UEs par semestre */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Unités d'Enseignement ({statistiques.nombre_ues})
          </h2>

          {Object.entries(uesParSemestre).map(([semestre, uesList]) => (
            <div key={semestre} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{semestre}</h3>
                <p className="text-teal-100 text-sm">
                  {uesList.length} UE{uesList.length > 1 ? "s" : ""} - 
                  {" "}{uesList.reduce((sum, ue) => sum + (ue.credit || 0), 0)} crédits
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crédits
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coefficient
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uesList.map((ue) => (
                      <tr key={ue.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {ue.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{ue.libelle}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                            {ue.credit || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-900">
                            {ue.coefficient || "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {ues.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                Aucune UE n'est associée à cette inscription
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}