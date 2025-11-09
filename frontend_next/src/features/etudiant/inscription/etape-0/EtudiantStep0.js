"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import inscriptionService from "@/services/inscription/inscriptionService";

export default function NouvelEtudiantStep0() {
  const [typeEtudiant, setTypeEtudiant] = useState("");
  const [numCarte, setNumCarte] = useState("");
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);
  const router = useRouter();

  const gererChangementType = (type) => {
    setTypeEtudiant(type);
    setErreurs({});
    if (type === 'nouveau') setNumCarte("");
  };

  const verifierAncienEtudiant = async () => {
    if (!numCarte.trim()) {
      setErreurs({ numCarte: "Veuillez saisir votre numéro de carte" });
      return false;
    }
    setChargement(true);
    try {
      const response = await inscriptionService.verifierAncienEtudiant(numCarte.trim());
      if (response.existe) {
        localStorage.setItem("ancien_etudiant_complet", JSON.stringify({
          etudiant: response.etudiant,
          derniere_inscription: response.derniere_inscription,
          prochaine_annee: response.prochaine_annee,
          ues_disponibles: response.ues_disponibles,
          ues_validees: response.ues_validees
        }));
        localStorage.setItem("type_inscription", JSON.stringify({
          typeEtudiant: 'ancien',
          numCarteExistant: numCarte.trim(),
          ancienEtudiantVerifie: true
        }));
        return true;
      } else {
        setErreurs({ numCarte: response.message || "Numéro de carte non trouvé dans nos registres" });
        return false;
      }
    } catch (error) {
      console.error("Erreur de vérification:", error);
      setErreurs({ numCarte: error.message || "Erreur lors de la vérification. Réessayez." });
      return false;
    } finally {
      setChargement(false);
    }
  };

  const continuer = async () => {
    if (!typeEtudiant) {
      setErreurs({ type: "Veuillez sélectionner votre situation" });
      return;
    }
    if (typeEtudiant === 'ancien') {
      const isValid = await verifierAncienEtudiant();
      if (!isValid) return;
    } else {
      localStorage.removeItem("ancien_etudiant_complet");
      localStorage.removeItem("ancien_etudiant_info");
      localStorage.setItem("type_inscription", JSON.stringify({
        typeEtudiant: 'nouveau',
        numCarteExistant: null
      }));
    }
    router.push('/etudiant/inscription/etape-1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl mx-auto">

        {/* Titre */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Inscription pédagogique
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Choisissez votre situation pour commencer l'inscription
        </p>

        {/* Cartes côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* NOUVEAU ÉTUDIANT */}
          <div
            onClick={() => gererChangementType('nouveau')}
            className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer border ${
              typeEtudiant === 'nouveau' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H9v-1c0-1.105.895-2 2-2h2c1.105 0 2 .895 2 2v1zm-3-9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-700 mb-2">
                  Nouvel étudiant
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Je m'inscris pour la première fois dans cet établissement
                </p>
              </div>
            </div>
          </div>

          {/* ANCIEN ÉTUDIANT */}
          <div
            onClick={() => gererChangementType('ancien')}
            className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer border ${
              typeEtudiant === 'ancien' ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-700 mb-2">
                  Ancien étudiant
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Je suis déjà inscrit et je renouvelle mon inscription
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Champ numéro de carte */}
        {typeEtudiant === 'ancien' && (
          <div className="mt-12 max-w-md mx-auto">
            <label className="block text-gray-700 font-semibold mb-2 text-center">
              Numéro de carte étudiant*
            </label>
            <input
              type="text"
              value={numCarte}
              onChange={(e) => setNumCarte(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-green-400 bg-white ${
                erreurs.numCarte ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 523456"
            />
            {erreurs.numCarte && (
              <p className="text-red-500 text-sm mt-2 text-center">{erreurs.numCarte}</p>
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Saisissez votre numéro de carte de l'année précédente
            </p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-center gap-6 mt-12">
          <Link
            href="/"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            Annuler
          </Link>
          <button
            onClick={continuer}
            disabled={chargement || !typeEtudiant}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {chargement ? "Vérification..." : "Continuer"}
          </button>
        </div>

        {/* Pied de page */}
        <p className="text-center text-xs text-gray-400 mt-12 select-none">
          © EPL {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}