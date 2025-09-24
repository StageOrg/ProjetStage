"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation'; 
import { validateForm } from "@/components/ui/ValidationUtils"; 

// Configuration des champs pour l'étape 1 (nouveaux étudiants)
const step1FieldsConfig = {
  email: { required: true },
  username: { required: true },
  password: { required: true },
};

export default function NouvelEtudiantStep1() { 
  const [typeInscription, setTypeInscription] = useState(null);
  const [ancienEtudiantData, setAncienEtudiantData] = useState(null);
  const [formulaire, setFormulaire] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(false);
  const router = useRouter(); 

  // Chargement des données selon le type d'inscription
  useEffect(() => {
    const typeData = localStorage.getItem("type_inscription");
    if (typeData) {
      const parsed = JSON.parse(typeData);
      setTypeInscription(parsed);
      
      if (parsed.typeEtudiant === 'ancien') {
        // Charger les données de l'ancien étudiant et pré-remplir tous les champs
        const ancienData = localStorage.getItem("ancien_etudiant_complet");
        if (ancienData) {
          const parsedAncien = JSON.parse(ancienData);
          setAncienEtudiantData(parsedAncien);
          
          // Pré-remplir tous les champs avec les données existantes
          setFormulaire(prev => ({
            ...prev,
            email: parsedAncien.etudiant.email || "",
            username: parsedAncien.etudiant.username || "", 
            password: "********", // Mot de passe masqué mais pré-rempli
          }));
        } else {
          // Rediriger vers étape 0 si données manquantes
          router.push('/etudiant/inscription/etape-0');
        }
      } else {
        // Charger données sauvegardées pour nouveaux étudiants
        const donneesSauvegardees = localStorage.getItem("inscription_step1");
        if (donneesSauvegardees) {
          const parsed = JSON.parse(donneesSauvegardees);
          setFormulaire(prev => ({
            ...prev,
            username: parsed.username || "",
            password: "",
            email: parsed.email || "",
          }));
        }
      }
    } else {
      // Rediriger vers étape 0 si pas de type défini
      router.push('/etudiant/inscription/etape-0');
    }
  }, [router]);

  const gererChangement = (e) => {
    const { name, value } = e.target;
    setFormulaire(prev => ({ ...prev, [name]: value }));
    if (erreurs[name]) {
      setErreurs(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validerFormulaire = () => {
    const nouvellesErreurs = validateForm(formulaire, step1FieldsConfig);
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  };

  const confirmerAncienEtudiant = () => {
    if (typeInscription?.typeEtudiant === 'ancien') {
      // Sauvegarder les données modifiées
      const donneesAEtager = {
        ...formulaire,
        ancienEtudiant: true,
        etudiant_id: ancienEtudiantData.etudiant.id
      };
      localStorage.setItem("inscription_step1", JSON.stringify(donneesAEtager));
      
      // Passer directement à l'étape 2
      router.push('/etudiant/inscription/etape-2');
    }
  };

  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    
    // Gestion différente selon le type d'étudiant
    if (typeInscription?.typeEtudiant === 'ancien') {
      // Pour les anciens étudiants, validation simplifiée
      const champsObligatoires = ['email'];
      const nouvellesErreurs = {};
      
      champsObligatoires.forEach(champ => {
        if (!formulaire[champ] || !formulaire[champ].trim()) {
          nouvellesErreurs[champ] = `${champ} est requis`;
        }
      });
      
      // Validation email format
      if (formulaire.email && !/\S+@\S+\.\S+/.test(formulaire.email)) {
        nouvellesErreurs.email = "Format email invalide";
      }
      
      setErreurs(nouvellesErreurs);
      
      if (Object.keys(nouvellesErreurs).length > 0) return;
      
      confirmerAncienEtudiant();
      return;
    }

    // Pour les nouveaux étudiants - validation complète
    if (!validerFormulaire()) return;

    setChargement(true);

    try {
      // Sauvegarder les données pour l'étape suivante (nouveaux étudiants)
      const donneesAEtager = {
        ...formulaire,
      };
      localStorage.setItem("inscription_step1", JSON.stringify(donneesAEtager));
      
      router.push('/etudiant/inscription/etape-2');
    } catch (error) {
      console.error("Erreur:", error);
      setErreurs({ formulaire: "Une erreur s'est produite" });
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettreFormulaire} className="flex flex-col gap-6 mx-auto w-full max-w-lg bg-white/80 backdrop-blur-md px-8 py-10 border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
        {typeInscription?.typeEtudiant === 'ancien' ? 'Vos informations de connexion' : 'Création du compte'}
      </h2>
      
      {/* Message informatif pour les anciens étudiants */}
      {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Profil trouvé !</h3>
          <p className="text-sm text-green-700">
            Bonjour <strong>{ancienEtudiantData.etudiant.nom} {ancienEtudiantData.etudiant.prenom}</strong>,
            vos informations de connexion ont été pré-remplies.
          </p>
        </div>
      )}
      
      {/* Champ Email */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Email*</label>
        <input
          name="email"
          value={formulaire.email}
          onChange={gererChangement}
          type="email"
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.email ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`} 
          placeholder="exemple@email.com"
        />
        {erreurs.email && <p className="text-red-500 text-sm mt-1">{erreurs.email}</p>}
      </div>

      {/* Champ Nom d'utilisateur */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Nom d'utilisateur*
        </label>
        <input
          name="username"
          value={formulaire.username}
          onChange={gererChangement}
          autoComplete="off"
          type="text"
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.username ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`} 
          placeholder="Votre nom d'utilisateur"
          readOnly={typeInscription?.typeEtudiant === 'ancien'}
        />
        {erreurs.username && <p className="text-red-500 text-sm mt-1">{erreurs.username}</p>}
        {typeInscription?.typeEtudiant === 'ancien' && (
          <p className="text-xs text-gray-500 mt-1">
            Votre nom d'utilisateur actuel
          </p>
        )}
      </div>

      {/* Champ Mot de passe */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Mot de passe*
        </label>
        <input
          name="password"
          value={formulaire.password}
          onChange={gererChangement}
          type="password"
          className={`w-full px-4 py-2 rounded-lg border ${
            erreurs.password ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`} 
          placeholder="Votre mot de passe"
          readOnly={typeInscription?.typeEtudiant === 'ancien'}
        />
        {erreurs.password && <p className="text-red-500 text-sm mt-1">{erreurs.password}</p>}
        {typeInscription?.typeEtudiant === 'ancien' && (
          <p className="text-xs text-gray-500 mt-1">
            Votre mot de passe actuel (masqué pour sécurité)
          </p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between mt-6 gap-4">
        <Link href="/etudiant/inscription/etape-0" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center">
          Retour
        </Link>
        <button 
          type="submit" 
          disabled={chargement}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded-lg shadow transition-all disabled:opacity-50">
          {chargement ? "Validation..." : "Continuer"}
        </button>
      </div>
    </form>
  );
}