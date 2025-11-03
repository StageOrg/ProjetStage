"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation'; 
import { validateForm, validateField } from "@/components/ui/ValidationUtils";  // Ajout : Import de validateField pour password.
import api from "@/services/api";  // Pour les checks API (email/username).

// Configuration des champs pour l'étape 1 (nouveaux étudiants) – simple objet pour validation.
const step1FieldsConfig = {
  email: { required: true },
  username: { required: true },
  password: { required: true },
  confirmPassword: { required: true },
};

export default function NouvelEtudiantStep1() { 
  const [typeInscription, setTypeInscription] = useState(null);  // Type : 'nouveau' ou 'ancien'.
  const [ancienEtudiantData, setAncienEtudiantData] = useState(null);  // Données ancien étudiant.
  const [formulaire, setFormulaire] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [erreurs, setErreurs] = useState({});  // Erreurs par champ (objet) – inclut maintenant unicité/validité.
  const [chargement, setChargement] = useState(false);  // Chargement soumission.
  const [verificationEnCours, setVerificationEnCours] = useState({});  // Loader pour vérif (ex: {username: true}).
  const [showPassword, setShowPassword] = useState(false);  // State pour toggle mot de passe (false = masqué).
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);  // State pour toggle confirmation mot de passe.
  const router = useRouter(); 

  // Chargement des données selon le type d'inscription (localStorage ou ancien).
  useEffect(() => {
    const typeData = localStorage.getItem("type_inscription");
    if (typeData) {
      const parsed = JSON.parse(typeData);
      setTypeInscription(parsed);
      
      if (parsed.typeEtudiant === 'ancien') {
        // Pour ancien : Pré-remplit email/username, password masqué.
        const ancienData = localStorage.getItem("ancien_etudiant_complet");
        if (ancienData) {
          const parsedAncien = JSON.parse(ancienData);
          setAncienEtudiantData(parsedAncien);
          
          setFormulaire(prev => ({
            ...prev,
            email: parsedAncien.etudiant.email || "",
            username: parsedAncien.etudiant.username || "", 
            password: "********", // Masqué par défaut.
          }));
        } else {
          router.push('/etudiant/inscription/etape-0');  // Redirige si manquant.
        }
      } else {
        // Pour nouveau : Charge sauvegardé si existe.
        const donneesSauvegardees = localStorage.getItem("inscription_step1");
        if (donneesSauvegardees) {
          const parsed = JSON.parse(donneesSauvegardees);
          setFormulaire(prev => ({
            ...prev,
            username: parsed.username || "",
            password: parsed.password || "",
            email: parsed.email || "",
            confirmPassword: parsed.confirmPassword || "",
          }));
        }
      }
    } else {
      router.push('/etudiant/inscription/etape-0');  // Pas de type : Retour étape 0.
    }
  }, [router]);

  // useEffect pour mise à jour en temps réel de l'erreur de correspondance des mots de passe.
  useEffect(() => {
    if (typeInscription?.typeEtudiant === 'nouveau') {
      const matchError = formulaire.password !== formulaire.confirmPassword 
        ? "Les mots de passe ne correspondent pas." 
        : "";
      setErreurs(prev => ({ ...prev, confirmPassword: matchError }));
    }
  }, [formulaire.password, formulaire.confirmPassword, typeInscription]);

  // Changement champ (basique : Update state, efface erreur si valide).
  const gererChangement = (e) => {
    const { name, value } = e.target;
    setFormulaire(prev => ({ ...prev, [name]: value }));
    if (erreurs[name]) {
      setErreurs(prev => ({ ...prev, [name]: "" }));  // Efface erreur si corrigé.
    }
  };

  // Helper : Obtient l'erreur de validation pour un champ (sync ou async, retourne string | null).
  const obtenirErreurValidation = async (champ) => {
    const value = formulaire[champ]?.trim();
    if (!value) return null;  // Pas d'erreur si vide (requis géré ailleurs).

    // Password : Sync.
    if (champ === 'password') {
      return validateField('password', value, true);
    }

    // ConfirmPassword : Sync (correspondance).
    if (champ === 'confirmPassword') {
      return value !== formulaire.password ? "Les mots de passe ne correspondent pas." : null;
    }

    // Email/Username : Async API.
    try {
      let reponse;
      switch (champ) {
        case 'username':
          reponse = await api.post('/auth/check_username/', { username: value });
          return !reponse.data.disponible ? 'Ce nom d\'utilisateur est déjà pris.' : null;
        case 'email':
          reponse = await api.post('/auth/check_email/', { email: value });
          return !reponse.data.disponible ? 'Cet email est déjà utilisé.' : null;
        default:
          return null;
      }
    } catch (error) {
      console.error(`Erreur vérification ${champ}:`, error);
      if (error.response?.status === 400) {
        return error.response.data.erreur || 'Données invalides.';
      } else if (error.response?.status === 404) {
        return 'Service temporairement indisponible. Réessayez.';
      } else {
        return 'Erreur de vérification. Réessayez.';
      }
    }
  };

  // Fonction générique pour vérifier un champ sur onBlur (unicité/validité).
  const verifierChamp = async (champ) => {
    if (typeInscription?.typeEtudiant !== 'nouveau') return;  // Seulement pour nouveaux étudiants.

    const value = formulaire[champ]?.trim();
    if (!value) {
      setErreurs(prev => ({ ...prev, [champ]: '' }));  // Efface si vide.
      return;
    }

    setVerificationEnCours(prev => ({ ...prev, [champ]: true }));
    setErreurs(prev => ({ ...prev, [champ]: '' }));  // Efface précédente.

    const error = await obtenirErreurValidation(champ);
    if (error) {
      setErreurs(prev => ({ ...prev, [champ]: error }));
    }

    setVerificationEnCours(prev => ({ ...prev, [champ]: false }));
  };

  // Toggle visibilité mot de passe (simple : Change type input).
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);  // Inverse state (true/false).
  };

  // Toggle visibilité confirmation mot de passe.
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Confirmation pour ancien étudiant (sauvegarde et navigue).
  const confirmerAncienEtudiant = () => {
    if (typeInscription?.typeEtudiant === 'ancien') {
      const donneesAEtager = {
        ...formulaire,
        ancienEtudiant: true,
        etudiant_id: ancienEtudiantData.etudiant.id
      };
      localStorage.setItem("inscription_step1", JSON.stringify(donneesAEtager));  // Sauvegarde.
      router.push('/etudiant/inscription/etape-2');  // Navigue étape 2.
    }
  };

  // Soumission formulaire (validation + sauvegarde).
  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    
    // Reset erreurs globales.
    setErreurs({});
    
    // Gestion ancien étudiant (validation légère : email seulement, via validateField).
    if (typeInscription?.typeEtudiant === 'ancien') {
      const errorEmail = validateField('email', formulaire.email, true);
      if (errorEmail) {
        setErreurs({ email: errorEmail });
        const inputErrone = document.querySelector('[name="email"]');
        if (inputErrone) inputErrone.focus();
        return;
      }
      confirmerAncienEtudiant();
      return;
    }

    // Pour nouveau : Validation complète.
    const nouvellesErreurs = validateForm(formulaire, step1FieldsConfig);

    // Vérifications async pour unicité (seulement si pas d'erreur format déjà).
    const checkPromises = [];
    for (const champ of ['email', 'username']) {
      if (!nouvellesErreurs[champ]) {
        checkPromises.push(obtenirErreurValidation(champ));
      }
    }

    // Attendre et collecter erreurs async.
    let asyncErreurs = {};
    if (checkPromises.length > 0) {
      try {
        const results = await Promise.all(checkPromises);
        // Mapper résultats aux champs (email premier, username second).
        if (results[0]) asyncErreurs.email = results[0];
        if (results[1]) asyncErreurs.username = results[1];
      } catch (error) {
        console.error("Erreur lors des vérifications:", error);
        setErreurs({ general: "Erreur de vérification. Réessayez." });
        return;
      }
    }

    // Merge toutes les erreurs (format + async).
    let allErreurs = { ...nouvellesErreurs, ...asyncErreurs };

    // Vérification supplémentaire pour correspondance des mots de passe (sécurité en cas de soumission sans re-render).
    if (typeInscription?.typeEtudiant === 'nouveau' && !allErreurs.confirmPassword && formulaire.password !== formulaire.confirmPassword) {
      allErreurs.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    setErreurs(allErreurs);

    // Vérifier si erreurs.
    if (Object.keys(allErreurs).length > 0) {
      // Focus sur premier erroné.
      const premierChampErrone = Object.keys(allErreurs)[0];
      const inputErrone = document.querySelector(`[name="${premierChampErrone}"]`);
      if (inputErrone) inputErrone.focus();
      return;  // Bloque !
    }

    setChargement(true);

    try {
      // Sauvegarde localStorage pour étape suivante.
      const donneesAEtager = { ...formulaire };
      localStorage.setItem("inscription_step1", JSON.stringify(donneesAEtager));
      router.push('/etudiant/inscription/etape-2');  // Navigue seulement si tout OK.
    } catch (error) {
      console.error("Erreur:", error);
      setErreurs({ general: "Erreur de sauvegarde. Réessayez." });
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettreFormulaire} className="flex flex-col gap-6 mx-auto w-full max-w-lg bg-white/80 backdrop-blur-md px-8 py-10 border border-gray-300 rounded-lg shadow-lg">
      {/* Titre dynamique (ancien/nouveau). */}
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
        {typeInscription?.typeEtudiant === 'ancien' ? 'Vos informations de connexion' : 'Création du compte'}
      </h2>
      
      {/* Message ancien étudiant (si applicable). */}
      {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Profil trouvé !</h3>
          <p className="text-sm text-green-700">
            Bonjour <strong>{ancienEtudiantData.etudiant.nom} {ancienEtudiantData.etudiant.prenom}</strong>,
            vos informations de connexion ont été pré-remplies.
          </p>
        </div>
      )}
      
      {/* Affichage erreur générale si existe. */}
      {erreurs.general && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-red-600 text-sm">{erreurs.general}</p>
        </div>
      )}
      
      {/* Champ Email  */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Email*</label>
        <input
          name="email"
          value={formulaire.email}
          onChange={gererChangement}
          onBlur={() => verifierChamp('email')}  // Vérif unicité sur blur.
          type="email"
          disabled={typeInscription?.typeEtudiant === 'ancien'}
          className={`w-full px-4 py-2 rounded-lg border ${erreurs.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${verificationEnCours.email ? 'opacity-70' : ''}`} 
          placeholder="exemple@email.com"
        />
        {erreurs.email && <p className="text-red-500 text-sm mt-1">{erreurs.email}</p>}
      </div>

      {/* Champ Username  */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Nom d'utilisateur*
        </label>
        <input
          name="username"
          value={formulaire.username}
          onChange={gererChangement}
          onBlur={() => verifierChamp('username')}  // Vérif unicité sur blur.
          autoComplete="off"
          type="text"
          disabled={typeInscription?.typeEtudiant === 'ancien'}
          className={`w-full px-4 py-2 rounded-lg border ${erreurs.username ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${verificationEnCours.username ? 'opacity-70' : ''}`} 
          placeholder="Votre nom d'utilisateur"
        />
        {erreurs.username && <p className="text-red-500 text-sm mt-1">{erreurs.username}</p>}
        {typeInscription?.typeEtudiant === 'ancien' && (
          <p className="text-xs text-gray-500 mt-1">
            Votre nom d'utilisateur actuel
          </p>
        )}
      </div>

      {/* Champ Password avec icône toggle (œil). Erreur en rouge en bas. */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Mot de passe*
        </label>
        <div className="relative">
          <input
            name="password"
            value={formulaire.password}
            onChange={gererChangement}
            onBlur={() => verifierChamp('password')}  // Vérif force locale sur blur.
            type={showPassword ? "text" : "password"}
            disabled={typeInscription?.typeEtudiant === 'ancien'}
            className={`w-full px-4 py-2 rounded-lg border pr-10 ${erreurs.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${verificationEnCours.password ? 'opacity-70' : ''}`} 
            placeholder="Votre mot de passe"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            aria-label={showPassword ? "Masquer mot de passe" : "Afficher mot de passe"}
          >
            {showPassword ? (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {erreurs.password && <p className="text-red-500 text-sm mt-1">{erreurs.password}</p>}
        {typeInscription?.typeEtudiant === 'ancien' && (
          <p className="text-xs text-gray-500 mt-1">
            Votre mot de passe actuel (masqué par défaut).
          </p>
        )}
      </div>

      {/* Champ Confirmation Password (seulement pour nouveaux étudiants). */}
      {typeInscription?.typeEtudiant === 'nouveau' && (
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Confirmer le mot de passe*
          </label>
          <div className="relative">
            <input
              name="confirmPassword"
              value={formulaire.confirmPassword}
              onChange={gererChangement}
              onBlur={() => verifierChamp('confirmPassword')}  // Vérif correspondance sur blur.
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full px-4 py-2 rounded-lg border pr-10 ${erreurs.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${verificationEnCours.confirmPassword ? 'opacity-70' : ''}`} 
              placeholder="Confirmez votre mot de passe"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              aria-label={showConfirmPassword ? "Masquer confirmation mot de passe" : "Afficher confirmation mot de passe"}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {erreurs.confirmPassword && <p className="text-red-500 text-sm mt-1">{erreurs.confirmPassword}</p>}
        </div>
      )}

      {/* Boutons d'action. */}
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
};