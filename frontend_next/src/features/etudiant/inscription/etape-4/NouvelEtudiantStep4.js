"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import inscriptionService from "@/services/inscriptionService";
import { authAPI } from '@/services/authService';
import api from "@/services/api";

export default function NouvelEtudiantStep4() {
  const [ues, setUes] = useState([]);
  const [uesGroupedBySemester, setUesGroupedBySemester] = useState({});
  const [selectedUEs, setSelectedUEs] = useState({});
  const [typeInscription, setTypeInscription] = useState(null);
  const [ancienEtudiantData, setAncienEtudiantData] = useState(null);
  const [infosPedagogiques, setInfosPedagogiques] = useState({
    parcours_id: null,
    filiere_id: null,
    annee_etude_id: null,
    parcours_libelle: "",
    filiere_nom: "",
    annee_etude_libelle: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Charger les données des étapes précédentes
  useEffect(() => {
    const loadAllData = () => {
      // Vérifier le type d'inscription
      const typeData = localStorage.getItem("type_inscription");
      if (typeData) {
        const parsedType = JSON.parse(typeData);
        setTypeInscription(parsedType);
        
        if (parsedType.typeEtudiant === 'ancien') {
          // Charger les données de l'ancien étudiant
          const ancienData = localStorage.getItem("ancien_etudiant_complet");
          if (ancienData) {
            const parsedAncien = JSON.parse(ancienData);
            setAncienEtudiantData(parsedAncien);
            
            // Pour les anciens étudiants, utiliser leurs données existantes
            if (parsedAncien.prochaine_annee) {
              const mockStep3 = {
                parcours_id: parsedAncien.derniere_inscription.parcours.id,
                filiere_id: parsedAncien.derniere_inscription.filiere.id,
                annee_etude_id: parsedAncien.prochaine_annee.id,
                parcours_libelle: parsedAncien.derniere_inscription.parcours.libelle,
                filiere_nom: parsedAncien.derniere_inscription.filiere.nom,
                annee_etude_libelle: parsedAncien.prochaine_annee.libelle,
              };
              setInfosPedagogiques(mockStep3);
              fetchUEsForAncienEtudiant(mockStep3, parsedAncien);
            } else {
              // Cas où l'ancien étudiant doit choisir son parcours
              const step3Data = localStorage.getItem("inscription_step3");
              if (step3Data) {
                const parsedStep3 = JSON.parse(step3Data);
                setInfosPedagogiques(parsedStep3);
                fetchUEs(parsedStep3);
              }
            }
            return;
          }
        }
      }

      // Pour les nouveaux étudiants - logique normale
      const step1Data = localStorage.getItem("inscription_step1");
      const step2Data = localStorage.getItem("inscription_step2");
      const step3Data = localStorage.getItem("inscription_step3");
      
      if (!step1Data || !step2Data || !step3Data) {
        setError("Données d'inscription incomplètes. Veuillez reprendre depuis le début.");
        router.push("/etudiant/inscription/etape-1");
        return;
      }

      const parsedStep3 = JSON.parse(step3Data);
      setInfosPedagogiques(parsedStep3);
      
      // Charger les UEs pour cette configuration
      fetchUEs(parsedStep3);
    };
    
    loadAllData();
  }, [router]);

  // Récupérer les UEs depuis l'API (pour nouveaux étudiants)
  const fetchUEs = async (params) => {
    setLoading(true);
    try {
      const response = await inscriptionService.getUEs({
        parcours: params.parcours_id,
        filiere: params.filiere_id,
        annee_etude: params.annee_etude_id,
      });
      setUes(response);
      groupUEsBySemester(response);
    } catch (err) {
      setError("Erreur lors de la récupération des UEs.");
      console.error("Erreur dans fetchUEs:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les UEs pour ancien étudiant (inclut les UE disponibles)
  const fetchUEsForAncienEtudiant = async (params, ancienData) => {
    setLoading(true);
    try {
      console.log("🔍 Debug - Données ancien étudiant:", ancienData);
      console.log("🔍 Debug - Prochaine année:", ancienData.prochaine_annee);
      console.log("🔍 Debug - UEs disponibles dans les données:", ancienData.ues_disponibles);
      
      // Utiliser directement les UE disponibles retournées par l'API
      const uesDisponibles = ancienData.ues_disponibles || [];
      
      if (uesDisponibles.length === 0) {
        console.warn("⚠️ Aucune UE disponible pour cet ancien étudiant");
        setError("Aucune UE disponible pour votre inscription. Contactez l'administration.");
      }
      
      console.log(`✅ ${uesDisponibles.length} UE(s) disponible(s) pour l'ancien étudiant`);
      setUes(uesDisponibles);
      groupUEsBySemester(uesDisponibles);
    } catch (err) {
      setError("Erreur lors de la récupération des UEs.");
      console.error("Erreur dans fetchUEsForAncienEtudiant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les UEs par semestre
  const groupUEsBySemester = (uesArray) => {
    const grouped = {};
    uesArray.forEach(ue => {
      const semestreLibelle = ue.semestre?.libelle || "Sans semestre";
      if (!grouped[semestreLibelle]) {
        grouped[semestreLibelle] = [];
      }
      grouped[semestreLibelle].push(ue);
    });
    setUesGroupedBySemester(grouped);
  };

  // Gérer la sélection des UEs
  const handleCheckboxChange = (ueId) => {
    setSelectedUEs((prev) => ({
      ...prev,
      [ueId]: !prev[ueId],
    }));
  };

  // Convertir base64 en File object pour FormData
  const base64ToFile = (base64String, filename, mimeType) => {
    const byteCharacters = atob(base64String.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  };

  // Création complète pour nouveaux étudiants
  const createCompleteRegistration = async (allData, selectedUEIds) => {
    const formData = new FormData();
    
    // Données utilisateur (étape 1)
    formData.append('username', allData.step1.username);
    formData.append('password', allData.step1.password);
    formData.append('email', allData.step1.email);
    formData.append('first_name', allData.step2.prenom);
    formData.append('last_name', allData.step2.nom);
    formData.append('telephone', allData.step2.contact);
    
    // Données étudiant (étape 2)
    formData.append('date_naiss', allData.step2.date_naissance);
    formData.append('lieu_naiss', allData.step2.lieu_naiss);
    if (allData.step2.autre_prenom) {
      formData.append('autre_prenom', allData.step2.autre_prenom);
    }
    if (allData.step2.num_carte) {
      formData.append('num_carte', allData.step2.num_carte);
    }
    
    // Gérer la photo si elle existe
    if (allData.step2.photoBase64 && allData.step2.photoNom) {
      const photoFile = base64ToFile(
        allData.step2.photoBase64, 
        allData.step2.photoNom, 
        'image/jpeg'
      );
      formData.append('photo', photoFile);
    }

    // Étape 1 : Créer l'utilisateur et l'étudiant
    const userResponse = await authAPI.apiInstance().post('/auth/register-etudiant/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const { user_id, etudiant_id } = userResponse.data;

    // Étape 2 : Récupérer l'année académique active
    const anneeResponse = await api.get("/inscription/annee-academique/", {
      params: { ordering: "-libelle" },
    });
    const anneeAcademiqueId = anneeResponse.data[0]?.id;

    if (!anneeAcademiqueId) {
      throw new Error("Aucune année académique disponible.");
    }

    // Étape 3 : Créer l'inscription pédagogique
    const inscriptionData = {
      etudiant: etudiant_id,
      parcours: allData.step3.parcours_id,
      filiere: allData.step3.filiere_id,
      annee_etude: allData.step3.annee_etude_id,
      anneeAcademique: anneeAcademiqueId,
      ues: selectedUEIds,
      numero: `INS-${Date.now()}`,
    };

    const inscriptionResponse = await inscriptionService.createInscription(inscriptionData);

    return {
      user: userResponse.data,
      inscription: inscriptionResponse
    };
  };

  // Inscription pour ancien étudiant (seulement création inscription)
  const createInscriptionForAncienEtudiant = async (selectedUEIds) => {
    // LOGIQUE SIMPLIFIÉE: Un ancien étudiant a TOUJOURS une inscription précédente
    if (!ancienEtudiantData.prochaine_annee?.id) {
      throw new Error("Impossible de déterminer la prochaine année d'étude pour cet ancien étudiant");
    }
    
    const inscriptionData = {
      etudiant_id: ancienEtudiantData.etudiant.id,
      prochaine_annee_id: ancienEtudiantData.prochaine_annee.id,
      ues_selectionnees: selectedUEIds
    };

    console.log("Données envoyées pour ancien étudiant:", inscriptionData);

    const response = await inscriptionService.inscriptionAncienEtudiant(inscriptionData);
    return response;
  };

  // Soumettre l'inscription
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Vérifier si au moins une UE est sélectionnée
    const selectedUEIds = Object.keys(selectedUEs)
      .filter((id) => selectedUEs[id])
      .map(Number);
      
    if (selectedUEIds.length === 0) {
      setError("Veuillez sélectionner au moins une UE.");
      setLoading(false);
      return;
    }

    // Vérifier le total des crédits
    const totalCredits = ues
      .filter((ue) => selectedUEs[ue.id])
      .reduce((sum, ue) => sum + ue.nbre_credit, 0);
      
    if (totalCredits > 30) {
      setError("Le total des crédits ne peut pas dépasser 30.");
      setLoading(false);
      return;
    }

    try {
      let result;

      if (typeInscription?.typeEtudiant === 'ancien') {
        // Pour les anciens étudiants : seulement créer l'inscription
        console.log("🔄 Création inscription pour ancien étudiant...");
        result = await createInscriptionForAncienEtudiant(selectedUEIds);
        console.log("✅ Inscription ancien étudiant réussie:", result);
      } else {
        // Pour les nouveaux étudiants : processus complet
        const step1Data = JSON.parse(localStorage.getItem("inscription_step1"));
        const step2Data = JSON.parse(localStorage.getItem("inscription_step2"));
        const step3Data = JSON.parse(localStorage.getItem("inscription_step3"));

        const allData = {
          step1: step1Data,
          step2: step2Data,
          step3: step3Data
        };

        console.log("🚀 Début de la création complète...");
        result = await createCompleteRegistration(allData, selectedUEIds);
        console.log("✅ Inscription complète réussie:", result);
      }

      // Nettoyer le localStorage
      localStorage.removeItem("inscription_step1");
      localStorage.removeItem("inscription_step2");
      localStorage.removeItem("inscription_step3");
      localStorage.removeItem("type_inscription");
      localStorage.removeItem("ancien_etudiant_complet");

      // Rediriger vers la page de confirmation
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.push('/');
          
    } catch (err) {
      console.error("Erreur lors de l'inscription:", err);
      
      // Gestion spécifique des erreurs
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        // Cas spécial: Étudiant déjà inscrit cette année
        if (errorData.error && errorData.error.includes("déjà inscrit")) {
          setError(`${errorData.error}`);
          
          // Afficher les détails de l'inscription existante si disponibles
          if (errorData.details) {
            const details = errorData.details;
            setError(prev => prev + `\n\nDétails de votre inscription actuelle:\n` +
              `- Numéro: ${details.numero_inscription}\n` +
              `- Parcours: ${details.parcours}\n` +
              `- Filière: ${details.filiere}\n` +
              `- Année d'étude: ${details.annee_etude}`
            );
          }
          return; // Sortir ici pour ce cas spécial
        }
        
        // Autres erreurs 400
        if (errorData.username) {
          setError("Ce nom d'utilisateur existe déjà. Veuillez en choisir un autre.");
        } else if (errorData.email) {
          setError("Cette adresse email est déjà utilisée.");
        } else {
          setError(errorData.error || "Erreur de validation des données. Vérifiez vos informations.");
        }
      } else {
        setError("Erreur lors de la finalisation de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculer le total des crédits sélectionnés
  const totalCreditsSelectionnes = ues
    .filter((ue) => selectedUEs[ue.id])
    .reduce((sum, ue) => sum + ue.nbre_credit, 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-center mb-6">
        {typeInscription?.typeEtudiant === 'ancien' ? 'Sélection de vos UE' : 'Finalisation de l\'inscription'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">❌</span>
            {error}
          </div>
        </div>
      )}

      {/* Message spécial pour les anciens étudiants */}
      {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Inscription pour l'année suivante</h3>
          <p className="text-blue-700 text-sm mb-2">
            Vous vous inscrivez en <strong>{ancienEtudiantData.prochaine_annee?.libelle}</strong> pour 
            le parcours <strong>{ancienEtudiantData.derniere_inscription?.parcours.libelle}</strong>.
          </p>
          <p className="text-blue-600 text-xs">
            Les UE affichées sont celles que vous n'avez pas encore validées.
          </p>
        </div>
      )}

      {/* Récapitulatif normal pour nouveaux étudiants */}
      {typeInscription?.typeEtudiant !== 'ancien' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">📋 Récapitulatif de votre inscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <p><strong>Filière:</strong> {infosPedagogiques.filiere_nom}</p>
            <p><strong>Parcours:</strong> {infosPedagogiques.parcours_libelle}</p>
            <p><strong>Année:</strong> {infosPedagogiques.annee_etude_libelle}</p>
          </div>
        </div>
      )}

      <div className="mb-4 text-center">
        <p className="text-lg font-semibold">
          Crédits sélectionnés: <span className={totalCreditsSelectionnes > 30 ? "text-red-600" : "text-green-600"}>{totalCreditsSelectionnes}/30</span>
        </p>
        {totalCreditsSelectionnes > 30 && (
          <p className="text-red-500 text-sm">⚠️ Le total des crédits ne peut pas dépasser 30</p>
        )}
      </div>

      {/* Affichage des UEs par semestre */}
      <div className="mb-6">
        {Object.keys(uesGroupedBySemester).length === 0 ? (
          <div className="text-center text-gray-500 mb-6">
            Aucune UE disponible pour ces critères.
          </div>
        ) : (
          Object.entries(uesGroupedBySemester).map(([semestre, uesSemestre]) => (
            <div key={semestre} className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 bg-gray-100 p-3 rounded-lg">
                📚 {semestre} ({uesSemestre.length} UE{uesSemestre.length > 1 ? 's' : ''})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">Sélection</th>
                      <th className="border border-gray-300 p-3 text-left">Code UE</th>
                      <th className="border border-gray-300 p-3 text-left">Libellé</th>
                      <th className="border border-gray-300 p-3 text-center">Crédits</th>
                      <th className="border border-gray-300 p-3 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uesSemestre.map((ue) => (
                      <tr key={ue.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedUEs[ue.id] || false}
                            onChange={() => handleCheckboxChange(ue.id)}
                            className="w-5 h-5 accent-blue-600"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 font-mono text-sm">
                          {ue.code}
                        </td>
                        <td className="border border-gray-300 p-3 font-medium">
                          {ue.libelle}
                        </td>
                        <td className="border border-gray-300 p-3 text-center font-semibold">
                          {ue.nbre_credit}
                        </td>
                        <td className="border border-gray-300 p-3 text-sm text-gray-600">
                          {ue.description || "Aucune description"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between mt-6 gap-4">
        <Link
          href="/etudiant/inscription/etape-3"
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Retour
        </Link>
        <button
          type="submit"
          disabled={loading || ues.length === 0}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enregistrement..." : (typeInscription?.typeEtudiant === 'ancien' ? 'Confirmer inscription' : 'Finaliser inscription')}
        </button>
      </div>
    </form>
  );
}