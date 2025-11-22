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
    if (type === 'nouveau') {
      setNumCarte("");
    }
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
      if (error.message) {
        setErreurs({ numCarte: error.message });
      } else if (error.response?.status === 404) {
        setErreurs({ numCarte: "Numéro de carte non trouvé dans nos registres" });
      } else if (error.response?.status === 400) {
        setErreurs({ numCarte: "Numéro de carte invalide" });
      } else {
        setErreurs({ numCarte: "Erreur lors de la vérification. Réessayez." });
      }
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
      router.push('/etudiant/inscription/etape-1');
    } else {
      localStorage.removeItem("ancien_etudiant_complet");
      localStorage.removeItem("ancien_etudiant_info");
      localStorage.setItem("type_inscription", JSON.stringify({
        typeEtudiant: 'nouveau',
        numCarteExistant: null
      }));
      router.push('/etudiant/inscription/etape-1');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6 pt-1">
      <div className="w-full max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 mt-2">
          Inscription pédagogique
        </h1>
        <p className="text-center text-gray-600 mb-10">
          Choisissez votre situation pour commencer l'inscription
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-1">

          {/* NOUVEAU ÉTUDIANT */}
          <div
            onClick={() => gererChangementType('nouveau')}
            className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 transform hover:-translate-y-2
              ${typeEtudiant === 'nouveau' 
                ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50/30 scale-105' 
                : 'border-gray-200 hover:border-blue-300'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl transition-colors ${typeEtudiant === 'nouveau' ? 'bg-blue-500' : 'bg-blue-100'}`}>
                <svg className={`w-7 h-7 ${typeEtudiant === 'nouveau' ? 'text-white' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H9v-1c0-1.105.895-2 2-2h2c1.105 0 2 .895 2 2v1zm-3-9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold mb-2 ${typeEtudiant === 'nouveau' ? 'text-blue-700' : 'text-gray-800'}`}>
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
            className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-2 transform hover:-translate-y-2
              ${typeEtudiant === 'ancien' 
                ? 'border-green-500 ring-4 ring-green-100 bg-green-50/30 scale-105' 
                : 'border-gray-200 hover:border-green-300'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl transition-colors ${typeEtudiant === 'ancien' ? 'bg-green-500' : 'bg-green-100'}`}>
                <svg className={`w-7 h-7 ${typeEtudiant === 'ancien' ? 'text-white' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold mb-2 ${typeEtudiant === 'ancien' ? 'text-green-700' : 'text-gray-800'}`}>
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
          <div className="mt-10 max-w-md mx-auto">
            <label className="block text-gray-700 font-semibold mb-2 text-center">
              Numéro de carte étudiant*
            </label>
            <input
              type="text"
              value={numCarte}
              onChange={(e) => setNumCarte(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 text-base focus:outline-none focus:ring-4 focus:ring-green-300 transition-all ${
                erreurs.numCarte ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
              } bg-white`}
              placeholder="Ex: 523456"
            />
            {erreurs.numCarte && (
              <p className="text-red-500 text-sm mt-2 text-center font-medium">{erreurs.numCarte}</p>
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
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md transform hover:-translate-y-1"
          >
            Annuler
          </Link>
          <button
            onClick={continuer}
            disabled={chargement || !typeEtudiant}
            className="px-8 py-3 bg-blue-900 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all hover:shadow-md transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {chargement ? "Vérification..." : "Continuer →"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-12 select-none">
          © EPL-UL {new Date().getFullYear()}-Ecole Polytechnique de Lomé
        </p>
      </div>
    </div>
  );
}