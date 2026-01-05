"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { validateField, calculerDateMinimale, validerPhoto } from '@/components/ui/ValidationUtils';
import api from "@/services/api";
import toast from 'react-hot-toast';

export default function EtapeInfosPersonnelles() {
  const [typeInscription, setTypeInscription] = useState(null);
  const [ancienEtudiantData, setAncienEtudiantData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formulaire, setFormulaire] = useState({
    username: "",
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
  const [verificationEnCours, setVerificationEnCours] = useState({});
  const [dejaInscrit, setDejaInscrit] = useState(false);
  const [messageInscription, setMessageInscription] = useState(null);
  const router = useRouter();

  const champsRequis = {
    username: { required: false },
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

  // Sauvegarde automatique temporaire
  useEffect(() => {
    if (Object.keys(champsModifies).length > 0) {
      const donneesASauvegarder = {
        ...formulaire,
        owner: formulaire.username,
        photoNom: formulaire.photo?.name,
        photoBase64: apercu,
      };
      localStorage.setItem("inscription_step1_temp", JSON.stringify(donneesASauvegarder));
    }
  }, [formulaire, apercu, champsModifies]);

  useEffect(() => {
    const chargerDonnees = async () => {
      console.log("🔍 Chargement des données...");
      
      const typeData = localStorage.getItem("type_inscription");
      
      if (!typeData) {
        console.error(" Aucun type d'inscription trouvé");
        router.push('/');
        return;
      }

      const parsed = JSON.parse(typeData);
      console.log(" Type d'inscription:", parsed);
      setTypeInscription(parsed);
      
      if (parsed.typeEtudiant === 'ancien') {
        // ANCIEN ÉTUDIANT : Récupération fraîche depuis l'API
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                
                if (user.num_carte) {
                    const loadingToast = toast.loading("Chargement de vos informations...");
                    console.log("🔄 Récupération des infos ancien étudiant depuis l'API...");
                    
                    try {
                        const response = await api.get(`/inscription/verifier-ancien-etudiant/${user.num_carte}/`);
                        toast.dismiss(loadingToast);
                        const data = response.data;
                        
                        if (data.existe) {
                            setAncienEtudiantData(data);
                            
                            // Mettre à jour le localStorage "complet" pour les étapes suivantes qui en dépendent
                            localStorage.setItem("ancien_etudiant_complet", JSON.stringify({
                                etudiant: data.etudiant,
                                derniere_inscription: data.derniere_inscription,
                                prochaine_annee: data.prochaine_annee,
                                ues_disponibles: data.ues_disponibles,
                                ues_validees: data.ues_validees,
                                ues_non_validees: data.ues_non_validees
                            }));

                            // Pré-remplissage du formulaire
                            const etu = data.etudiant;
                            const sexeValide = ["M", "F"].includes(etu.sexe) ? etu.sexe : "";
                            
                            setFormulaire(prev => ({
                                ...prev,
                                username: etu.username || "",
                                last_name: etu.nom || "",
                                first_name: etu.prenom || "",
                                telephone: etu.telephone || "",
                                date_naiss: etu.date_naissance || "",
                                lieu_naiss: etu.lieu_naissance || "",
                                autre_prenom: etu.autre_prenom || "",
                                num_carte: etu.num_carte || "",
                                sexe: sexeValide,
                                photo: null, 
                            }));
                            
                            if (etu.photo) {
                                setApercu(etu.photo);
                            }
                            
                            toast.success("Informations récupérées avec succès");
                            
                        } else {
                            toast.error("Votre dossier étudiant est introuvable.");
                        }
                    } catch (err) {
                        toast.dismiss(loadingToast);
                        console.error("Erreur chargement API Ancien Etudiant:", err);
                        toast.error("Mode hors ligne : Utilisation des données locales.");
                        
                        // Fallback localStorage si erreur réseau
                        const ancienData = localStorage.getItem("ancien_etudiant_complet");
                        if (ancienData) {
                            const parsedAncien = JSON.parse(ancienData);
                            setAncienEtudiantData(parsedAncien);
                            const etu = parsedAncien.etudiant;
                            setFormulaire(prev => ({
                                ...prev,
                                username: etu.username || "",
                                last_name: etu.nom || "",
                                first_name: etu.prenom || "",
                                telephone: etu.telephone || "",
                                date_naiss: etu.date_naissance || "",
                                lieu_naiss: etu.lieu_naissance || "",
                                autre_prenom: etu.autre_prenom || "",
                                num_carte: etu.num_carte || "",
                                sexe: ["M", "F"].includes(etu.sexe) ? etu.sexe : "",
                            }));
                            if (etu.photo) setApercu(etu.photo);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Erreur globale :", err);
        }
      } else {
        // NOUVEAU ÉTUDIANT
        const userStr = localStorage.getItem('user');
        console.log("👤 Utilisateur:", userStr ? "Trouvé" : "Non trouvé");
        
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserData(user);
          
          // Charger données temporaires ou données de l'utilisateur
          const donneesTemp = localStorage.getItem("inscription_step1_temp");
          let tempLoaded = false;
          
          if (donneesTemp) {
            const parsedTemp = JSON.parse(donneesTemp);
            // Vérifier si les données temporaires appartiennent à cet utilisateur
            if (parsedTemp.owner === user.username) {
              console.log(" Chargement données temporaires");
              setFormulaire(parsedTemp);
              if (parsedTemp.photoBase64) {
                setApercu(parsedTemp.photoBase64);
              }
              tempLoaded = true;
            }
          }
          
          if (!tempLoaded) {
            console.log("📝 Chargement données de l'utilisateur");
            setFormulaire(prev => ({
              ...prev,
              username: user.username || "",
              last_name: user.last_name || "",
              first_name: user.first_name || "",
              sexe: user.sexe || "",
            }));
          }
        }
      }
    };
    
    chargerDonnees();
  }, []); // ← Tableau vide, s'exécute une seule fois au montage

  const gererChangement = (e) => {
    const { name, value } = e.target;
    
    if (typeInscription?.typeEtudiant === 'ancien') {
      if (name !== 'telephone') return;
    } else {
      if (['username', 'last_name', 'first_name', 'sexe'].includes(name)) return;
    }
    
    setFormulaire(prev => ({ ...prev, [name]: value }));
    setChampsModifies(prev => ({ ...prev, [name]: true }));
    
    const erreur = validateField(name, value, champsRequis[name]?.required);
    setErreurs(prev => ({ ...prev, [name]: erreur }));
  };

  const verifierChamp = async (champ) => {
    if (typeInscription?.typeEtudiant !== 'nouveau' || champsRequis[champ]?.required === false && !formulaire[champ]?.trim()) return;

    const value = formulaire[champ]?.trim();
    if (!value) {
      setErreurs(prev => ({ ...prev, [champ]: '' }));
      return;
    }

    if (champ !== 'num_carte') return;

    setVerificationEnCours(prev => ({ ...prev, [champ]: true }));
    setErreurs(prev => ({ ...prev, [champ]: '' }));

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
    };
    lecteur.readAsDataURL(fichier);

    e.target.value = null;
  };

  const validerFormulaire = () => {
    const nouvellesErreurs = {};
    
    Object.keys(champsRequis).forEach(key => {
      if (key !== 'photo' && key !== 'username') {
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
    
    console.log(" Soumission du formulaire...");
    
    setErreurs({});
    
    if (!validerFormulaire()) {
      console.log(" Validation échouée");
      return;
    }

    const formatErreurs = {};
    Object.keys(champsRequis).forEach(key => {
      if (key !== 'photo' && key !== 'username') {
        formatErreurs[key] = validateField(key, formulaire[key], champsRequis[key].required);
      }
    });

    // Vérification numéro de carte pour nouveaux étudiants
    if (typeInscription?.typeEtudiant === 'nouveau' && formulaire.num_carte?.trim() && !formatErreurs.num_carte) {
      setVerificationEnCours(prev => ({ ...prev, num_carte: true }));
      try {
        const reponse = await api.post('utilisateurs/check-num-carte/', { num_carte: formulaire.num_carte.trim() });
        if (!reponse.data.disponible) {
          setErreurs(prev => ({ ...prev, num_carte: 'Ce numéro de carte est déjà utilisé.' }));
          const inputErrone = document.querySelector('[name="num_carte"]');
          if (inputErrone) inputErrone.focus();
          return;
        }
      } catch (error) {
        console.error("Erreur vérification num_carte:", error);
        const msg = error.response?.status === 400 
          ? (error.response.data.erreur || 'Données invalides.')
          : 'Erreur de vérification. Réessayez.';
        setErreurs(prev => ({ ...prev, num_carte: msg }));
        const inputErrone = document.querySelector('[name="num_carte"]');
        if (inputErrone) inputErrone.focus();
        return;
      } finally {
        setVerificationEnCours(prev => ({ ...prev, num_carte: false }));
      }
    }

    setChargement(true);

    try {
      const donneesCompletes = {
        ...formulaire,
        photoNom: formulaire.photo?.name,
        photoBase64: apercu,
      };

      console.log(" Sauvegarde des données...");
      localStorage.setItem("inscription_step1", JSON.stringify(donneesCompletes));
      localStorage.removeItem("inscription_step1_temp");
      
      console.log(" Données sauvegardées");
      console.log(" Redirection vers étape 3");
      
      // Modification : Tout le monde passe par l'étape 3
      // Les anciens vérifieront leur année, les nouveaux choisiront tout
      router.push('/etudiant/inscription/etape-2');
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      setErreurs(prev => ({ ...prev, general: "Une erreur s'est produite lors de la sauvegarde" }));
    } finally {
      setChargement(false);
    }
  };

  if (dejaInscrit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Déjà inscrit
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Vous êtes déjà inscrit pour l'année académique <strong>{messageInscription?.annee}</strong>.
          </p>
          {messageInscription?.details && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm space-y-2">
              <p><span className="font-semibold">Parcours :</span> {messageInscription.details.parcours}</p>
              <p><span className="font-semibold">Filière :</span> {messageInscription.details.filiere}</p>
              <p><span className="font-semibold">Année :</span> {messageInscription.details.annee_etude}</p>
            </div>
          )}
          <p className="text-center text-sm text-gray-500 mb-6">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le responsable d'inscription.
          </p>
          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all text-center"
            >
              Accueil
            </Link>
            <Link
              href="/etudiant/dashboard/donnees-personnelles"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all text-center"
            >
              Mon Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={soumettreFormulaire} className="bg-white backdrop-blur-md px-8 py-10 w-full max-w-4xl flex flex-col gap-6 border border-gray-300 rounded-lg shadow-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-4">
        {typeInscription?.typeEtudiant === 'ancien' ? 'Vérification de vos informations' : 'Complétez vos informations personnelles'}
      </h2>
      
      {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Profil chargé</h3>
          <p className="text-sm text-blue-700">
            Vos informations ont été pré-remplies. Vous pouvez uniquement modifier votre photo et votre numéro de téléphone.
          </p>
        </div>
      )}

      {typeInscription?.typeEtudiant === 'nouveau' && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Nouvelle inscription</h3>
          <p className="text-sm text-green-700">
            Votre nom d'utilisateur, nom, prénom et sexe sont pré-remplis et ne peuvent pas être modifiés.
          </p>
        </div>
      )}

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
          {typeInscription?.typeEtudiant === 'nouveau' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nom d'utilisateur <span className="text-xs text-gray-500">(lecture seule)</span>
              </label>
              <input
                name="username"
                value={formulaire.username}
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none bg-gray-100 cursor-not-allowed"
                readOnly
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Nom* {typeInscription?.typeEtudiant === 'nouveau' && <span className="text-xs text-gray-500">(lecture seule)</span>}
            </label>
            <input
              name="last_name"
              value={formulaire.last_name}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.last_name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 cursor-not-allowed`}
              placeholder="Entrez votre nom"
              readOnly
            />
            {erreurs.last_name && <p className="text-red-500 text-sm mt-1">{erreurs.last_name}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Prénom* {typeInscription?.typeEtudiant === 'nouveau' && <span className="text-xs text-gray-500">(lecture seule)</span>}
            </label>
            <input
              name="first_name"
              value={formulaire.first_name}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.first_name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 cursor-not-allowed`}
              placeholder="Entrez votre prénom"
              readOnly
            />
            {erreurs.first_name && <p className="text-red-500 text-sm mt-1">{erreurs.first_name}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Autre prénom (optionnel)</label>
            <input
              name="autre_prenom"
              value={formulaire.autre_prenom}
              onChange={gererChangement}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                typeInscription?.typeEtudiant === 'ancien' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Prénom restant"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Numéro de carte (optionnel)</label>
            <input
              name="num_carte"
              value={formulaire.num_carte}
              onChange={gererChangement}
              onBlur={() => verifierChamp('num_carte')}
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${erreurs.num_carte ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                typeInscription?.typeEtudiant === 'ancien' ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${verificationEnCours.num_carte ? 'opacity-70' : ''}`}
              placeholder="Ex: 523456"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.num_carte && <p className="text-red-500 text-sm mt-1">{erreurs.num_carte}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Téléphone* {typeInscription?.typeEtudiant === 'ancien' && <span className="text-xs text-green-600">(modifiable)</span>}
            </label>
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
            <label className="block text-gray-700 font-semibold mb-2">
              Sexe* {typeInscription?.typeEtudiant === 'nouveau' && <span className="text-xs text-gray-500">(lecture seule)</span>}
            </label>
            <select
              name="sexe"
              value={formulaire.sexe}
              onChange={gererChangement}
              className={`w-full px-4 py-2 rounded-lg border ${
                erreurs.sexe ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100 cursor-not-allowed`}
              disabled
            >
              <option value="">Sélectionnez votre sexe</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            {erreurs.sexe && <p className="text-red-500 text-sm mt-1">{erreurs.sexe}</p>}
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
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                typeInscription?.typeEtudiant === 'ancien' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.date_naiss && <p className="text-red-500 text-sm mt-1">{erreurs.date_naiss}</p>}
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
              } focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white ${
                typeInscription?.typeEtudiant === 'ancien' ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="Ex: Lomé, Togo"
              readOnly={typeInscription?.typeEtudiant === 'ancien'}
            />
            {erreurs.lieu_naiss && <p className="text-red-500 text-sm mt-1">{erreurs.lieu_naiss}</p>}
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
          {chargement ? "Sauvegarde..." : "Continuer"}
        </button>
      </div>
    </form>
  );
}