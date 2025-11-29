"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { validateField, calculerDateMinimale, validerPhoto } from '@/components/ui/ValidationUtils';
import api from "@/services/api";  // Pour les checks API (num_carte).

export default function NouvelEtudiantStep2() {
  const [typeInscription, setTypeInscription] = useState(null);
  const [ancienEtudiantData, setAncienEtudiantData] = useState(null);
  const [formulaire, setFormulaire] = useState({
    last_name: "",
    first_name: "",
    telephone: "",
    date_naiss: "",
    lieu_naiss: "",
    autre_prenom: "",
    num_carte: "",
    sexe: "",
    photo: null,
  });
  const [apercu, setApercu] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [champsModifies, setChampsModifies] = useState({});
  const [chargement, setChargement] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState({});  // Loader pour vérif (ex: {num_carte: true}).
  const router = useRouter();

  const champsRequis = {
    last_name: { required: true },
    first_name: { required: true },
    telephone: { required: true },
    date_naiss: { required: true },
    lieu_naiss: { required: true },
    autre_prenom: { required: false },
    num_carte: { required: false },
    photo: { required: false },
    sexe: { required: true },
  };

  useEffect(() => {
    const typeData = localStorage.getItem("type_inscription");
    if (typeData) {
      const parsed = JSON.parse(typeData);
      setTypeInscription(parsed);
      
      if (parsed.typeEtudiant === 'ancien') {
        const ancienData = localStorage.getItem("ancien_etudiant_complet");
        if (ancienData) {
          const parsedAncien = JSON.parse(ancienData);
          setAncienEtudiantData(parsedAncien);
          
          // Valider la valeur de sexe
          const sexeValide = ["M", "F"].includes(parsedAncien.etudiant.sexe) ? parsedAncien.etudiant.sexe : "";
          
          setFormulaire(prev => ({
            ...prev,
            last_name: parsedAncien.etudiant.nom || "",
            first_name: parsedAncien.etudiant.prenom || "",
            telephone: parsedAncien.etudiant.telephone || "",
            date_naiss: parsedAncien.etudiant.date_naissance || "",
            lieu_naiss: parsedAncien.etudiant.lieu_naissance || "",
            autre_prenom: parsedAncien.etudiant.autre_prenom || "",
            num_carte: parsedAncien.etudiant.num_carte || "",
            sexe: sexeValide,
            photo: null,
          }));
          
          // Valider le sexe immédiatement
          if (!sexeValide) {
            setErreurs(prev => ({
              ...prev,
              sexe: "Le sexe enregistré est invalide. Veuillez sélectionner Masculin ou Féminin.",
            }));
            setChampsModifies(prev => ({ ...prev, sexe: true }));
          }
          
          if (parsedAncien.etudiant.photo_url) {
            setApercu(parsedAncien.etudiant.photo_url);
          }
        }
      } else {
        const donneesSauvegardees = localStorage.getItem("inscription_step2");
        if (donneesSauvegardees) {
          const parsed = JSON.parse(donneesSauvegardees);
          const sexeValide = ["M", "F"].includes(parsed.sexe) ? parsed.sexe : "";
          
          setFormulaire(prev => ({
            ...prev,
            last_name: parsed.last_name || "",
            first_name: parsed.first_name || "",
            telephone: parsed.telephone || "",
            date_naiss: parsed.date_naiss || "",
            lieu_naiss: parsed.lieu_naiss || "",
            autre_prenom: parsed.autre_prenom || "",
            num_carte: parsed.num_carte || "",
            sexe: sexeValide,
            photo: null,
          }));
          
          if (!sexeValide && parsed.sexe) {
            setErreurs(prev => ({
              ...prev,
              sexe: "Le sexe enregistré est invalide. Veuillez sélectionner Masculin ou Féminin.",
            }));
            setChampsModifies(prev => ({ ...prev, sexe: true }));
          }
          
          if (parsed.photoBase64) {
            setApercu(parsed.photoBase64);
          }
        }
      }
    }
  }, []);

  // Changement champ (basique : Update state, efface erreur si valide).
  const gererChangement = (e) => {
    const { name, value } = e.target;
    setFormulaire(prev => ({ ...prev, [name]: value }));
    setChampsModifies(prev => ({ ...prev, [name]: true }));
    
    const erreur = validateField(name, value, champsRequis[name]?.required);
    setErreurs(prev => ({ ...prev, [name]: erreur }));
  };

  // Fonction générique pour vérifier un champ sur onBlur (unicité/validité).
  const verifierChamp = async (champ) => {
    if (typeInscription?.typeEtudiant !== 'nouveau' || champsRequis[champ]?.required === false && !formulaire[champ]?.trim()) return;  // Seulement pour nouveaux, et si fourni pour optionnels.

    const value = formulaire[champ]?.trim();
    if (!value) {
      setErreurs(prev => ({ ...prev, [champ]: '' }));  // Efface si vide.
      return;
    }

    if (champ !== 'num_carte') return;  // Pour l'instant, seulement num_carte a API.

    setVerificationEnCours(prev => ({ ...prev, [champ]: true }));
    setErreurs(prev => ({ ...prev, [champ]: '' }));  // Efface précédente.

    try {
      const reponse = await api.post('utilisateurs/check-num-carte/', { num_carte: value });
      if (!reponse.data.disponible) {
        setErreurs(prev => ({ ...prev, [champ]: 'Ce numéro de carte est déjà utilisé.' }));
      }
    } catch (error) {
      console.error(`Erreur vérification ${champ}:`, error);
      if (error.response?.status === 400) {
        setErreurs(prev => ({ ...prev, [champ]: error.response.data.erreur || 'Données invalides.' }));
      } else {
        setErreurs(prev => ({ ...prev, [champ]: 'Erreur de vérification. Réessayez.' }));
      }
    } finally {
      setVerificationEnCours(prev => ({ ...prev, [champ]: false }));
    }
  };

  const gererChangementPhoto = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    setChampsModifies(prev => ({ ...prev, photo: true }));
    
    const erreurPhoto = validerPhoto(fichier);
    
    if (erreurPhoto) {
      setErreurs({ photo: erreurPhoto });
      return;
    }

    setFormulaire(prev => ({ ...prev, photo: fichier }));
    setErreurs(prev => ({ ...prev, photo: "" }));

    const lecteur = new FileReader();
    lecteur.onload = () => {
      const resultatBase64 = lecteur.result;
      setApercu(resultatBase64);
      
      const donneesExistantes = JSON.parse(localStorage.getItem("inscription_step2") || "{}");
      localStorage.setItem("inscription_step2", JSON.stringify({
        ...donneesExistantes,
        photoNom: fichier.name,
        photoBase64: resultatBase64,
      }));
    };
    lecteur.readAsDataURL(fichier);

    e.target.value = null;
  };

  const validerFormulaire = () => {
    const nouvellesErreurs = {};
    
    Object.keys(champsRequis).forEach(key => {
      if (key !== 'photo') {
        nouvellesErreurs[key] = validateField(key, formulaire[key], champsRequis[key].required);
      }
    });
    
    setErreurs(nouvellesErreurs);
    setChampsModifies(
      Object.keys(champsRequis).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );
    
    return Object.values(nouvellesErreurs).every(error => !error);
  };

  // Soumission formulaire (validation + sauvegarde).
  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    
    // Reset erreurs globales.
    setErreurs({});
    
    if (!validerFormulaire()) return;

    // Re-calculer les erreurs de format localement pour décision synchrone.
    const formatErreurs = {};
    Object.keys(champsRequis).forEach(key => {
      if (key !== 'photo') {
        formatErreurs[key] = validateField(key, formulaire[key], champsRequis[key].required);
      }
    });

    // Vérif unicité num_carte seulement pour nouveau et si format OK et fourni.
    if (typeInscription?.typeEtudiant === 'nouveau' && formulaire.num_carte?.trim() && !formatErreurs.num_carte) {
      setVerificationEnCours(prev => ({ ...prev, num_carte: true }));
      try {
        const reponse = await api.post('utilisateurs/check-num-carte/', { num_carte: formulaire.num_carte.trim() });
        if (!reponse.data.disponible) {
          setErreurs(prev => ({ ...prev, num_carte: 'Ce numéro de carte est déjà utilisé.' }));
          const inputErrone = document.querySelector('[name="num_carte"]');
          if (inputErrone) inputErrone.focus();
          return;  // Bloque !
        }
      } catch (error) {
        console.error("Erreur lors de la vérification num_carte:", error);
        const msg = error.response?.status === 400 
          ? (error.response.data.erreur || 'Données invalides.')
          : 'Erreur de vérification. Réessayez.';
        setErreurs(prev => ({ ...prev, num_carte: msg }));
        const inputErrone = document.querySelector('[name="num_carte"]');
        if (inputErrone) inputErrone.focus();
        return;  // Bloque !
      } finally {
        setVerificationEnCours(prev => ({ ...prev, num_carte: false }));
      }
    }

    setChargement(true);

    try {
      const donneesEtape1 = JSON.parse(localStorage.getItem("inscription_step1") || "{}");
      
      const donneesCompletes = {
        email: donneesEtape1.email,
        username: donneesEtape1.username,
        password: donneesEtape1.password,
        password_confirmation: donneesEtape1.password_confirmation,
        ...formulaire,
        photoNom: formulaire.photo?.name,
        photoBase64: apercu,
      };

      localStorage.setItem("inscription_step2", JSON.stringify(donneesCompletes));
      
      if (typeInscription?.typeEtudiant === 'ancien') {
        if (ancienEtudiantData?.derniere_inscription && ancienEtudiantData?.prochaine_annee) {
          router.push('/etudiant/inscription/etape-3');
        } else {
          router.push('/etudiant/inscription/etape-3');
        }
      } else {
        router.push('/etudiant/inscription/etape-3');
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      setErreurs(prev => ({ ...prev, general: "Une erreur s'est produite lors de la sauvegarde" }));
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettreFormulaire} className="bg-white backdrop-blur-md px-8 py-10 w-full max-w-4xl flex flex-col gap-6 border border-gray-300 rounded-lg shadow-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
        {typeInscription?.typeEtudiant === 'ancien' ? 'Vos informations personnelles' : 'Informations personnelles'}
      </h2>
      
      {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Profil chargé !</h3>
          <p className="text-sm text-green-700">
            Vos informations ont été pré-remplies. Vous pouvez modifier le sexe si nécessaire.
          </p>
        </div>
      )}

      {/* Affichage erreur générale si existe. */}
      {erreurs.general && (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-red-600 text-sm">{erreurs.general}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Photo de profil</label>
        <div className="relative w-32 h-32 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center overflow-hidden mb-2">
          {apercu ? (
            <img 
              src={apercu} 
              alt="Aperçu de la photo de profil" 
              className="w-full h-full object-cover"/>
          ) : (
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.25a8.25 8.25 0 1115 0v.25a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.25z" />
            </svg>
          )}
          <input
            id="photoInput"
            type="file"
            accept="image/jpeg, image/png"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={gererChangementPhoto}/>
          <label htmlFor="photoInput" className="absolute bottom-0 bg-white/90 text-black font-medium text-xs px-2 py-1 rounded-full shadow flex items-center gap-1 cursor-pointer hover:bg-white transition-all">
            {apercu ? "Changer" : "Ajouter"}
          </label>
        </div>
        {erreurs.photo && <p className="text-red-500 text-sm">{erreurs.photo}</p>}
        <span className="text-xs text-gray-400">Formats acceptés : JPG, PNG (max 2Mo)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nom*</label>
            <input
              name="last_name"
              value={formulaire.last_name}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.last_name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Entrez votre nom"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.last_name && <p className="text-red-500 text-sm mt-1">{erreurs.last_name}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Prénom*</label>
            <input
              name="first_name"
              value={formulaire.first_name}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.first_name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Entrez votre prénom"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.first_name && <p className="text-red-500 text-sm mt-1">{erreurs.first_name}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Autre prénom (optionnel)</label>
            <input
              name="autre_prenom"
              value={formulaire.autre_prenom}
              onChange={gererChangement}
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              placeholder="prénom restant"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Numéro de carte (optionnel)</label>
            <input
              name="num_carte"
              value={formulaire.num_carte}
              onChange={gererChangement}
              onBlur={() => verifierChamp('num_carte')}  // Vérif unicité sur blur.
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${erreurs.num_carte ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${verificationEnCours.num_carte ? 'opacity-70' : ''}`}
              placeholder="Ex:523456"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.num_carte && <p className="text-red-500 text-sm mt-1">{erreurs.num_carte}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Téléphone*</label>
            <input
              name="telephone"
              value={formulaire.telephone}
              onChange={gererChangement}
              type="tel"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.telephone ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Numéro de téléphone"
            />
            {erreurs.telephone && <p className="text-red-500 text-sm mt-1">{erreurs.telephone}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sexe*</label>
            <select
              name="sexe"
              value={formulaire.sexe}
              onChange={gererChangement}
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.sexe ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
            >
              <option value="">Sélectionnez votre sexe</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            {erreurs.sexe && <p className="text-red-500 text-sm mt-1">{erreurs.sexe}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1"></p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Date de naissance*</label>
            <input
              name="date_naiss"
              value={formulaire.date_naiss}
              onChange={gererChangement}
              type="date"
              max={calculerDateMinimale()}
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.date_naiss ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.date_naiss && <p className="text-red-500 text-sm mt-1">{erreurs.date_naiss}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Lieu de naissance*</label>
            <input
              name="lieu_naiss"
              value={formulaire.lieu_naiss}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.lieu_naiss ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Ex: Lomé, Togo"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.lieu_naiss && <p className="text-red-500 text-sm mt-1">{erreurs.lieu_naiss}</p>}
            {typeInscription?.typeEtudiant === 'ancien' && (
              <p className="text-xs text-gray-500 mt-1">Pré-rempli avec vos informations</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6 gap-4">
        <Link href="/" className="bg-red-600 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center">
          Annuler
        </Link>
        <button 
          type="submit" 
          disabled={chargement}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-8 rounded-lg shadow transition-all disabled:opacity-50">
          {chargement ? "Sauvegarde..." : "Continuer →"}
        </button>
      </div>
    </form>
  );
}