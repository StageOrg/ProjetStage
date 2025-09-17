"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { authAPI } from '@/services/authService';

export default function AncienEtudiantStep1() {
  const [formulaire, setFormulaire] = useState({
    username: "",
    password: "",
  });
  const [ancienEtudiant, setAncienEtudiant] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);
  const router = useRouter();

  useEffect(() => {
  // Vérifier qu'on vient bien de l'étape 0
  const typeInscription = localStorage.getItem("type_inscription");
  const ancienEtudiantInfo = localStorage.getItem("ancien_etudiant_info");

  // Si aucune info, redirection
  if (!typeInscription || !ancienEtudiantInfo) {
    router.push('/etudiant/inscription/etape-2');
    return;
  }

  let parsed = null;
  try {
    parsed = JSON.parse(ancienEtudiantInfo);
  } catch (error) {
    console.error("Erreur lors du parsing de ancien_etudiant_info :", error);
    router.push('/etudiant/inscription/etape-0'); // rediriger si JSON invalide
    return;
  }

  if (!parsed) {
    router.push('/etudiant/inscription/etape-0'); // rediriger si null
    return;
  }

  setAncienEtudiant(parsed);

  // Pré-remplir le nom d'utilisateur si possible
  setFormulaire(prev => ({ 
    ...prev, 
    username: parsed.email ? parsed.email.split('@')[0] : parsed.num_carte || ''
  }));
}, [router]);


  const gererChangement = (e) => {
    const { name, value } = e.target;
    setFormulaire(prev => ({ ...prev, [name]: value }));
    if (erreurs[name]) {
      setErreurs(prev => ({ ...prev, [name]: "" }));
    }
  };

  const verifierConnexion = async (e) => {
    e.preventDefault();
    
    if (!formulaire.username || !formulaire.password) {
      setErreurs({ 
        formulaire: "Veuillez remplir tous les champs" 
      });
      return;
    }

    setChargement(true);
    
    try {
      // Tenter de se connecter avec les identifiants
      const response = await authAPI.apiInstance().post('/auth/login/', {
        username: formulaire.username,
        password: formulaire.password
      });

      if (response.data) {
        // Connexion réussie, sauvegarder les tokens temporairement
        localStorage.setItem("ancien_etudiant_auth", JSON.stringify({
          access_token: response.data.access,
          refresh_token: response.data.refresh,
          verified: true
        }));
        
        // Passer à l'étape 2 avec infos pré-remplies
        router.push('/etudiant/inscription/etape-2');
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      if (error.response?.status === 401) {
        setErreurs({ 
          formulaire: "Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe." 
        });
      } else {
        setErreurs({ 
          formulaire: "Erreur de connexion. Réessayez plus tard." 
        });
      }
    } finally {
      setChargement(false);
    }
  };

  if (!ancienEtudiant) {
    return (
      <div className="text-center">
        <p>Redirection en cours...</p>
      </div>
    );
  }

  return (
    <form 
      onSubmit={verifierConnexion} 
      className="flex flex-col gap-6 mx-auto w-full max-w-lg bg-white/80 backdrop-blur-md px-8 py-10 border border-gray-300 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold text-center text-green-800 mb-4">
        Vérification d'identité
      </h2>
      
      {/* Informations de l'étudiant trouvé */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-green-800 mb-2">✓ Étudiant trouvé :</h3>
        <p className="text-sm text-green-700">
          <strong>Nom :</strong> {ancienEtudiant.prenom} {ancienEtudiant.nom}
        </p>
        <p className="text-sm text-green-700">
          <strong>Numéro de carte :</strong> {ancienEtudiant.num_carte}
        </p>
        <p className="text-sm text-green-700">
          <strong>Email :</strong> {ancienEtudiant.email}
        </p>
      </div>

      <p className="text-center text-sm text-gray-600 mb-4">
        Veuillez confirmer votre identité avec vos identifiants actuels
      </p>

      {erreurs.formulaire && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {erreurs.formulaire}
        </div>
      )}

      {/* Champ Nom d'utilisateur */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Nom d'utilisateur ou Email*
        </label>
        <input
          name="username"
          value={formulaire.username}
          onChange={gererChangement}
          type="text"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          placeholder="Votre nom d'utilisateur ou email"
        />
      </div>

      {/* Champ Mot de passe */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Mot de passe actuel*
        </label>
        <input
          name="password"
          value={formulaire.password}
          onChange={gererChangement}
          type="password"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          placeholder="Votre mot de passe actuel"
        />
      </div>

      <p className="text-xs text-gray-500">
       Utilisez les mêmes identifiants que pour votre dernière connexion
      </p>

      {/* Boutons d'action */}
      <div className="flex justify-between mt-6 gap-4">
        <Link 
          href="/etudiant/inscription/etape-0" 
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Retour
        </Link>
        <button 
          type="submit" 
          disabled={chargement}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded-lg shadow transition-all disabled:opacity-50"
        >
          {chargement ? "Vérification..." : "Vérifier"}
        </button>
      </div>

      {/* Lien mot de passe oublié */}
      <div className="text-center mt-4">
        <Link 
          href="/auth/forgot-password" 
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}