"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { validateField, calculerDateMinimale, validerPhoto } from '@/components/ui/ValidationUtils';

export default function NouvelEtudiantStep2() {
  const [formulaire, setFormulaire] = useState({
    nom: "",       
    prenom: "",    
    contact: "",   
    sexe: "",      // NOUVEAU CHAMP
    date_naissance: "", 
    lieu_naiss: "", 
    autre_prenom: "",
    num_carte: "",
    photo: null,
  });
  const [apercu, setApercu] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const [champsModifies, setChampsModifies] = useState({});
  const [chargement, setChargement] = useState(false);
  const [isAncienEtudiant, setIsAncienEtudiant] = useState(false);
  const router = useRouter();

  // Configuration des champs requis (SEXE AJOUTÉ)
  const champsRequis = {
    nom: { required: true },
    prenom: { required: true },
    contact: { required: true },
    sexe: { required: true },      // NOUVEAU
    date_naissance: { required: true },
    lieu_naiss: { required: true },
    autre_prenom: { required: false },
    num_carte: { required: false },
    photo: { required: false }
  };

  // Chargement des données sauvegardées + support anciens étudiants
  useEffect(() => {
    // Vérifier le type d'inscription
    const typeInscription = JSON.parse(localStorage.getItem("type_inscription") || "{}");
    const isAncien = typeInscription.typeEtudiant === "ancien";
    setIsAncienEtudiant(isAncien);

    if (isAncien) {
      // Pré-remplir avec les données de l'ancien étudiant
      const ancienEtudiantInfo = JSON.parse(localStorage.getItem("ancien_etudiant_info") || "{}");
      setFormulaire(prev => ({
        ...prev,
        nom: ancienEtudiantInfo.nom || "",
        prenom: ancienEtudiantInfo.prenom || "",
        contact: ancienEtudiantInfo.telephone || "",
        sexe: ancienEtudiantInfo.sexe || "",
        date_naissance: ancienEtudiantInfo.date_naiss || "",
        lieu_naiss: ancienEtudiantInfo.lieu_naiss || "",
        autre_prenom: ancienEtudiantInfo.autre_prenom || "",
        num_carte: ancienEtudiantInfo.num_carte || "",
      }));
    } else {
      // Charger les données sauvegardées normalement
      const donneesSauvegardees = localStorage.getItem("inscription_step2");
      if (donneesSauvegardees) {
        const parsed = JSON.parse(donneesSauvegardees);
        setFormulaire(prev => ({
          ...prev,
          nom: parsed.nom || "",       
          prenom: parsed.prenom || "",    
          contact: parsed.contact || "",   
          sexe: parsed.sexe || "",        // NOUVEAU
          date_naissance: parsed.date_naissance || "", 
          lieu_naiss: parsed.lieu_naiss || "", 
          autre_prenom: parsed.autre_prenom || "",
          num_carte: parsed.num_carte || "",
          photo: null,
        }));
        if (parsed.photoBase64) {
          setApercu(parsed.photoBase64);
        }
      }
    }
  }, []);

  const gererChangement = (e) => {
    const { name, value } = e.target;
    setFormulaire(prev => ({ ...prev, [name]: value }));
    setChampsModifies(prev => ({ ...prev, [name]: true }));
    
    // Validation en temps réel après modification
    if (champsModifies[name]) {
      const erreur = validateField(name, value, champsRequis[name]?.required);
      setErreurs(prev => ({ ...prev, [name]: erreur }));
    }
  };

  const gererChangementPhoto = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    setChampsModifies(prev => ({ ...prev, photo: true }));
    
    // Validation de la photo
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
      
      // CORRECTION : Sauvegarde après FileReader
      const donneesCompletes = {
        ...formulaire,  // Inclure TOUS les champs actuels
        sexe: formulaire.sexe,  // S'assurer que le sexe est inclus
        photoNom: fichier.name,
        photoBase64: resultatBase64,
        photoTaille: fichier.size,
        photoType: fichier.type
      };
      localStorage.setItem("inscription_step2", JSON.stringify(donneesCompletes));
    };
    lecteur.readAsDataURL(fichier);

    e.target.value = null;
  };

  const validerFormulaire = () => {
    const nouvellesErreurs = {};
    
    // Valider tous les champs
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

  const soumettreFormulaire = async (e) => {
    e.preventDefault();
    if (!validerFormulaire()) return;

    setChargement(true);

    try {
      let donneesCompletes;

      if (isAncienEtudiant) {
        // Pour ancien étudiant, pas besoin des données étape 1
        donneesCompletes = {
          // Pas d'étape 1 car déjà authentifié
          // Étape 2 - données personnelles mises à jour
          ...formulaire,
          photoNom: formulaire.photo?.name,
          photoBase64: apercu
        };
      } else {
        // Pour nouveau étudiant, récupérer les données de l'étape 1
        const donneesEtape1 = JSON.parse(localStorage.getItem("inscription_step1") || "{}");
        
        donneesCompletes = {
          // Étape 1
          email: donneesEtape1.email,
          username: donneesEtape1.username,
          password: donneesEtape1.password,
          password_confirmation: donneesEtape1.password_confirmation,
          
          // Étape 2
          ...formulaire,
          photoNom: formulaire.photo?.name,
          photoBase64: apercu
        };
      }

      // Sauvegarder toutes les données pour l'étape suivante
      localStorage.setItem("inscription_step2", JSON.stringify(donneesCompletes));
      
      // Naviguer vers l'étape 3
      router.push('/etudiant/inscription/etape-3');
      
    } catch (error) {
      console.error("Erreur:", error);
      setErreurs({ formulaire: "Une erreur s'est produite lors de la sauvegarde" });
    } finally {
      setChargement(false);
    }
  };

  return (
    <form onSubmit={soumettreFormulaire} className="bg-white backdrop-blur-md px-8 py-10 w-full max-w-4xl flex flex-col gap-6 border border-gray-300 rounded-lg shadow-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
        {isAncienEtudiant ? "Mise à jour de vos informations" : "Informations personnelles"}
      </h2>
      <p className="text-center text-sm text-gray-600 mb-4">
        {isAncienEtudiant ? 
          "✏️ Vérifiez et modifiez vos informations si nécessaire" :
          "📝 Vos données sont sauvegardées temporairement. Le compte sera créé à la dernière étape."
        }
      </p>
      
      {/* Photo de profil */}
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

      {/* Grille à 2 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Champ Nom */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Nom*</label>
            <input
              name="nom"
              value={formulaire.nom}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.nom ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Entrez votre nom"
            />
            {erreurs.nom && <p className="text-red-500 text-sm mt-1">{erreurs.nom}</p>}
          </div>

          {/* Champ Prénom */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Prénom*</label>
            <input
              name="prenom"
              value={formulaire.prenom}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.prenom ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Entrez votre prénom"
            />
            {erreurs.prenom && <p className="text-red-500 text-sm mt-1">{erreurs.prenom}</p>}
          </div>

          {/* Autre prénom */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Autre prénom (optionnel)</label>
            <input
              name="autre_prenom" 
              value={formulaire.autre_prenom} 
              onChange={gererChangement} 
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              placeholder="prénom restant" 
            />
          </div>

          {/* Numéro de carte */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Numéro de carte {isAncienEtudiant ? "(non modifiable)" : "(optionnel)"}
            </label>
            <input
              name="num_carte"
              value={formulaire.num_carte}
              onChange={gererChangement}
              type="text"
              disabled={isAncienEtudiant}
              className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                isAncienEtudiant ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Ex:523456"
            />
            {erreurs.num_carte && <p className="text-red-500 text-sm mt-1">{erreurs.num_carte}</p>}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* NOUVEAU : Champ Sexe */}
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
              <option value="">Sélectionner</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            {erreurs.sexe && <p className="text-red-500 text-sm mt-1">{erreurs.sexe}</p>}
          </div>

          {/* Champ Contact */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Téléphone*</label>
            <input
              name="contact"
              value={formulaire.contact}
              onChange={gererChangement}
              type="tel"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.contact ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
              placeholder="Numéro de téléphone"
            />
            {erreurs.contact && <p className="text-red-500 text-sm mt-1">{erreurs.contact}</p>}
          </div>

          {/* Champ Date de naissance */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Date de naissance*</label>
            <input
              name="date_naissance"
              value={formulaire.date_naissance}
              onChange={gererChangement}
              type="date"
              max={calculerDateMinimale()}
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.date_naissance ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white`}
            />
            {erreurs.date_naissance && <p className="text-red-500 text-sm mt-1">{erreurs.date_naissance}</p>}
          </div>

          {/* Champ Lieu de naissance */}
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
            />
            {erreurs.lieu_naiss && <p className="text-red-500 text-sm mt-1">{erreurs.lieu_naiss}</p>}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between mt-6 gap-4">
        <Link 
          href={isAncienEtudiant ? "/etudiant/inscription/ancien-etape-1" : "/etudiant/inscription/etape-1"} 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Retour
        </Link>
        <button 
          type="submit" 
          disabled={chargement}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-8 rounded-lg shadow transition-all disabled:opacity-50"
        >
          {chargement ? "Sauvegarde..." : "Suivant"}
        </button>
      </div>
    </form>
  );
}