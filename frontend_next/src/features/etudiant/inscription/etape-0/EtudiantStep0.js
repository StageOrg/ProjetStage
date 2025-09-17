"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import api from "@/services/api";

export default function EtudiantStep0() {
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
      // Vérifier si l'étudiant existe dans la base
      const response = await api.get(`/utilisateurs/etudiants/?num_carte=${numCarte}`);
      const etudiants = response.data.results || response.data;
      
      if (etudiants && etudiants.length > 0) {
        const etudiant = etudiants[0];
        
        // Sauvegarder les infos de l'ancien étudiant
        localStorage.setItem("ancien_etudiant_info", JSON.stringify({
          id: etudiant.id,
          num_carte: etudiant.num_carte,
          nom: etudiant.utilisateur?.last_name || etudiant.last_name,
          prenom: etudiant.utilisateur?.first_name || etudiant.first_name,
          email: etudiant.utilisateur?.email || etudiant.email,
          telephone: etudiant.utilisateur?.telephone || etudiant.telephone,
          sexe: etudiant.utilisateur?.sexe || etudiant.sexe,
          autre_prenom: etudiant.autre_prenom,
          date_naiss: etudiant.date_naiss,
          lieu_naiss: etudiant.lieu_naiss,
        }));
        
        return true;
      } else {
        setErreurs({ numCarte: "Numéro de carte non trouvé dans nos registres" });
        return false;
      }
    } catch (error) {
      console.error("Erreur de vérification:", error);
      setErreurs({ numCarte: "Erreur lors de la vérification. Réessayez." });
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

    // Sauvegarder le type d'étudiant choisi
    localStorage.setItem("type_inscription", JSON.stringify({
      typeEtudiant,
      numCarteExistant: typeEtudiant === 'ancien' ? numCarte : null
    }));

    if (typeEtudiant === 'ancien') {
      const isValid = await verifierAncienEtudiant();
      if (!isValid) return;
      
      // Rediriger vers étape 1 spéciale pour anciens étudiants
      router.push('/etudiant/inscription/ancien-etape-1');
    } else {
      // Nettoyer les anciennes données au cas où
      localStorage.removeItem("ancien_etudiant_info");
      
      // Rediriger vers le processus normal (étape 1 actuelle)
      router.push('/etudiant/inscription/etape-1');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md px-8 py-10 w-full max-w-lg mx-auto border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
        Inscription pédagogique
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Choisissez votre situation pour commencer l'inscription
      </p>

      {erreurs.type && (
        <p className="text-red-500 text-sm text-center mb-4">{erreurs.type}</p>
      )}

      {/* Sélection du type d'étudiant */}
      <div className="space-y-4 mb-6">
        <div
          onClick={() => gererChangementType('nouveau')}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            typeEtudiant === 'nouveau'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full border-2 mr-4 ${
              typeEtudiant === 'nouveau' 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {typeEtudiant === 'nouveau' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Nouvel étudiant</h3>
              <p className="text-sm text-gray-600">
                Je m'inscris pour la première fois dans cet établissement
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => gererChangementType('ancien')}
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            typeEtudiant === 'ancien'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-green-300'
          }`}
        >
          <div className="flex items-center">
            <div className={`w-4 h-4 rounded-full border-2 mr-4 ${
              typeEtudiant === 'ancien' 
                ? 'border-green-500 bg-green-500' 
                : 'border-gray-300'
            }`}>
              {typeEtudiant === 'ancien' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Ancien étudiant</h3>
              <p className="text-sm text-gray-600">
                Je suis déjà inscrit et je renouvelle mon inscription
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Champ numéro de carte pour anciens étudiants */}
      {typeEtudiant === 'ancien' && (
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Numéro de carte étudiant*
          </label>
          <input
            type="text"
            value={numCarte}
            onChange={(e) => setNumCarte(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${
              erreurs.numCarte ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-green-400 bg-white`}
            placeholder="Ex: 523456"
          />
          {erreurs.numCarte && (
            <p className="text-red-500 text-sm mt-1">{erreurs.numCarte}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Saisissez votre numéro de carte de l'année précédente
          </p>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-between mt-8 gap-4">
        <Link
          href="/"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Annuler
        </Link>
        <button
          onClick={continuer}
          disabled={chargement}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-8 rounded-lg shadow transition-all disabled:opacity-50"
        >
          {chargement ? "Vérification..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}