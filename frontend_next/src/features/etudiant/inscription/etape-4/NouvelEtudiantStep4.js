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

  const LIMITE_CREDITS_MAX = 70;

  useEffect(() => {
    const loadAllData = () => {
      const typeData = localStorage.getItem("type_inscription");
      if (typeData) {
        const parsedType = JSON.parse(typeData);
        setTypeInscription(parsedType);
        
        if (parsedType.typeEtudiant === 'ancien') {
          const ancienData = localStorage.getItem("ancien_etudiant_complet");
          if (ancienData) {
            const parsedAncien = JSON.parse(ancienData);
            setAncienEtudiantData(parsedAncien);
            
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
      
      fetchUEs(parsedStep3);
    };
    
    loadAllData();
  }, [router]);

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

  const fetchUEsForAncienEtudiant = async (params, ancienData) => {
    setLoading(true);
    try {
      console.log(" Debug - Données ancien étudiant:", ancienData);
      
      if (!ancienData.ues_disponibles) {
        console.error(" Pas d'UEs disponibles dans les données");
        setError("Aucune UE disponible. Contactez l'administration.");
        return;
      }
      
      if (!ancienData.prochaine_annee) {
        console.error("Pas de prochaine année définie");
        setError("Impossible de déterminer votre prochaine année d'étude.");
        return;
      }
      
      const uesDisponibles = ancienData.ues_disponibles;
      console.log(` ${uesDisponibles.length} UE(s) disponible(s)`);
      
      const uesCorrigees = uesDisponibles.map(ue => ({
        ...ue,
        semestre: ue.semestre || { libelle: "Semestre non défini" }
      }));
      
      setUes(uesCorrigees);
      groupUEsBySemester(uesCorrigees);
      
    } catch (err) {
      console.error(" Erreur dans fetchUEsForAncienEtudiant:", err);
      setError("Erreur lors de la récupération des UEs pour ancien étudiant.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCheckboxChange = (ueId) => {
    const ue = ues.find(u => u.id === ueId);
    if (!ue) return;

    if (!selectedUEs[ueId]) {
      const totalCreditsActuels = ues
        .filter((u) => selectedUEs[u.id])
        .reduce((sum, u) => sum + u.nbre_credit, 0);
      
      if (totalCreditsActuels + ue.nbre_credit > LIMITE_CREDITS_MAX) {
        setError(`Impossible d'ajouter cette UE. Vous dépasseriez la limite de ${LIMITE_CREDITS_MAX} crédits.`);
        return;
      }
    }

    setSelectedUEs((prev) => ({
      ...prev,
      [ueId]: !prev[ueId],
    }));

    if (selectedUEs[ueId] && error.includes("limite")) {
      setError("");
    }
  };

  const base64ToFileImproved = async (base64String, filename) => {
    return new Promise((resolve, reject) => {
      try {
        if (!base64String.includes(',')) {
          reject(new Error('Format base64 invalide'));
          return;
        }
        
        const [header, data] = base64String.split(',');
        const mimeMatch = header.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const byteCharacters = atob(data);
        const byteArray = new Uint8Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        
        const file = new File([byteArray], filename, { type: mimeType });
        resolve(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const createCompleteRegistration = async (allData, selectedUEIds) => {
    console.log(" Données reçues pour création:", allData);
    
    const formData = new FormData();
    
    formData.append('username', allData.step1.username);
    formData.append('password', allData.step1.password);
    formData.append('email', allData.step1.email);
    
    formData.append('first_name', allData.step2.first_name);
    formData.append('last_name', allData.step2.last_name);
    formData.append('telephone', allData.step2.telephone);
    formData.append('date_naiss', allData.step2.date_naiss);
    formData.append('lieu_naiss', allData.step2.lieu_naiss);
    
    // Validation du sexe avant envoi
    if (!["M", "F"].includes(allData.step2.sexe)) {
      throw new Error("Sexe invalide. Veuillez sélectionner Masculin ou Féminin.");
    }
    formData.append('sexe', allData.step2.sexe);
    
    if (allData.step2.autre_prenom) {
      formData.append('autre_prenom', allData.step2.autre_prenom);
    }
    if (allData.step2.num_carte) {
      formData.append('num_carte', allData.step2.num_carte);
    }
    
    if (allData.step2.photo instanceof File) {
      formData.append('photo', allData.step2.photo);
    } else if (allData.step2.photoBase64 && allData.step2.photoNom) {
      try {
        const photoFile = await base64ToFileImproved(
          allData.step2.photoBase64, 
          allData.step2.photoNom
        );
        formData.append('photo', photoFile);
      } catch (error) {
        console.warn("Erreur conversion photo, ignorée:", error);
      }
    }

    console.log(" FormData envoyé:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    const userResponse = await authAPI.apiInstance().post('/auth/register-etudiant/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log(" Utilisateur créé:", userResponse.data);
    const { user_id, etudiant_id } = userResponse.data;

    const anneeResponse = await api.get("/inscription/annee-academique/", {
      params: { est_active: true },
    });
    
    const anneeAcademique = anneeResponse.data.find(a => a.est_active) || anneeResponse.data[0];
    if (!anneeAcademique?.id) {
      throw new Error("Aucune année académique active disponible.");
    }

    console.log(" Année académique:", anneeAcademique);

    const inscriptionData = {
      etudiant: etudiant_id,
      parcours: parseInt(allData.step3.parcours_id),
      filiere: parseInt(allData.step3.filiere_id),
      annee_etude: parseInt(allData.step3.annee_etude_id),
      anneeAcademique: anneeAcademique.id,
      ues: selectedUEIds,
      numero: `INS-${Date.now()}-${etudiant_id}`,
    };

    console.log(" Données inscription:", inscriptionData);
    const inscriptionResponse = await inscriptionService.createInscription(inscriptionData);
    console.log(" Inscription créée:", inscriptionResponse);

    return {
      user: userResponse.data,
      inscription: inscriptionResponse
    };
  };

  const createInscriptionForAncienEtudiant = async (selectedUEIds) => {
    if (!ancienEtudiantData?.etudiant?.id) {
      throw new Error("Données de l'ancien étudiant manquantes");
    }
    if (!ancienEtudiantData?.prochaine_annee?.id) {
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

  const handleInscriptionError = (err) => {
    if (err.response?.status === 400) {
      const errorData = err.response.data;
      
      if (errorData.error?.includes("déjà inscrit")) {
        setError(`${errorData.error}\n\nVous êtes déjà inscrit pour cette année.`);
      } else if (errorData.username) {
        setError("Ce nom d'utilisateur existe déjà.");
      } else if (errorData.email) {
        setError("Cette adresse email est déjà utilisée.");
      } else if (errorData.sexe) {
        setError("Erreur avec le champ sexe: " + errorData.sexe);
      } else {
        setError(`Erreur de validation: ${JSON.stringify(errorData)}`);
      }
    } else if (err.message) {
      setError(err.message);
    } else {
      setError("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const selectedUEIds = Object.keys(selectedUEs)
      .filter((id) => selectedUEs[id])
      .map(Number);
      
    if (selectedUEIds.length === 0) {
      setError("Veuillez sélectionner au moins une UE.");
      setLoading(false);
      return;
    }

    const totalCredits = ues
      .filter((ue) => selectedUEs[ue.id])
      .reduce((sum, ue) => sum + ue.nbre_credit, 0);
      
    if (totalCredits > LIMITE_CREDITS_MAX) {
      setError(`Le total des crédits ne peut pas dépasser ${LIMITE_CREDITS_MAX}.`);
      setLoading(false);
      return;
    }

    try {
      let result;

      if (typeInscription?.typeEtudiant === 'ancien') {
        if (!ancienEtudiantData?.etudiant?.id) {
          throw new Error("Données de l'ancien étudiant manquantes");
        }
        if (!ancienEtudiantData?.prochaine_annee?.id) {
          throw new Error("Prochaine année d'étude non définie");
        }
        
        console.log(" Inscription ancien étudiant...");
        result = await createInscriptionForAncienEtudiant(selectedUEIds);
      } else {
        const step1Data = localStorage.getItem("inscription_step1");
        const step2Data = localStorage.getItem("inscription_step2");
        const step3Data = localStorage.getItem("inscription_step3");

        if (!step1Data || !step2Data || !step3Data) {
          throw new Error("Données d'inscription incomplètes");
        }

        const allData = {
          step1: JSON.parse(step1Data),
          step2: JSON.parse(step2Data),
          step3: JSON.parse(step3Data)
        };

        const requiredFields = ['username', 'email', 'password', 'sexe'];
        const missingFields = requiredFields.filter(field => !allData.step1[field] && !allData.step2[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Données manquantes: ${missingFields.join(', ')}`);
        }

        console.log(" Création complète nouvel étudiant...");
        result = await createCompleteRegistration(allData, selectedUEIds);
      }

      ['inscription_step1', 'inscription_step2', 'inscription_step3', 
       'type_inscription', 'ancien_etudiant_complet'].forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(" Inscription réussie:", result);
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.push('/');
      
    } catch (err) {
      console.error(" Erreur inscription:", err);
      handleInscriptionError(err);
    } finally {
      setLoading(false);
    }
  };

  const totalCreditsSelectionnes = ues
    .filter((ue) => selectedUEs[ue.id])
    .reduce((sum, ue) => sum + ue.nbre_credit, 0);

  const getCreditColor = (credits) => {
    if (credits > LIMITE_CREDITS_MAX) return "text-red-600";
    if (credits > LIMITE_CREDITS_MAX * 0.8) return "text-orange-600";
    return "text-green-600";
  };

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
            <div className="whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}

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

      {typeInscription?.typeEtudiant !== 'ancien' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-blue-800"> Récapitulatif de votre inscription</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <p><strong>Filière:</strong> {infosPedagogiques.filiere_nom}</p>
            <p><strong>Parcours:</strong> {infosPedagogiques.parcours_libelle}</p>
            <p><strong>Année:</strong> {infosPedagogiques.annee_etude_libelle}</p>
          </div>
        </div>
      )}

      <div className="mb-4 text-center">
        <p className="text-lg font-semibold">
          Crédits sélectionnés: <span className={getCreditColor(totalCreditsSelectionnes)}>{totalCreditsSelectionnes}/{LIMITE_CREDITS_MAX}</span>
        </p>
        {totalCreditsSelectionnes > LIMITE_CREDITS_MAX && (
          <p className="text-red-500 text-sm"> Le total des crédits ne peut pas dépasser {LIMITE_CREDITS_MAX}</p>
        )}
        {totalCreditsSelectionnes > LIMITE_CREDITS_MAX * 0.8 && totalCreditsSelectionnes <= LIMITE_CREDITS_MAX && (
          <p className="text-orange-500 text-sm"> Attention: Vous approchez de la limite de {LIMITE_CREDITS_MAX} crédits</p>
        )}
      </div>

      <div className="mb-6">
        {Object.keys(uesGroupedBySemester).length === 0 ? (
          <div className="text-center text-gray-500 mb-6">
            {loading ? "Chargement des UE..." : "Aucune UE disponible pour ces critères."}
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
                    {uesSemestre.map((ue) => {
                      const wouldExceedLimit = !selectedUEs[ue.id] && 
                        (totalCreditsSelectionnes + ue.nbre_credit > LIMITE_CREDITS_MAX);
                      
                      return (
                        <tr key={ue.id} className={`hover:bg-gray-50 ${wouldExceedLimit ? 'opacity-50' : ''}`}>
                          <td className="border border-gray-300 p-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUEs[ue.id] || false}
                              onChange={() => handleCheckboxChange(ue.id)}
                              disabled={wouldExceedLimit}
                              className="w-5 h-5 accent-blue-600 disabled:opacity-50"
                              title={wouldExceedLimit ? `Sélectionner cette UE dépasserait la limite de ${LIMITE_CREDITS_MAX} crédits` : ''}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between mt-6 gap-4">
        <Link
          href="/etudiant/inscription/etape-3"
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-8 rounded-lg shadow transition-all text-center"
        >
          Retour
        </Link>
        <button
          type="submit"
          disabled={loading || ues.length === 0 || totalCreditsSelectionnes > LIMITE_CREDITS_MAX}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enregistrement..." : (typeInscription?.typeEtudiant === 'ancien' ? 'Confirmer inscription' : 'Finaliser inscription')}
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
        <p> <strong>Limite de crédits:</strong> Vous pouvez sélectionner jusqu'à {LIMITE_CREDITS_MAX} crédits maximum pour cette inscription.</p>
      </div>
    </form>
  );
}