"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import inscriptionService from "@/services/inscription/inscriptionService";
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UETable from '@/components/ui/ueTable';
import toast from 'react-hot-toast';

const LIMITE_CREDITS_MAX = 70;

export default function EtapeSelectionUE() {
  const [ues, setUes] = useState([]);
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
  const [stats, setStats] = useState({
    ues_validees: 0,
    ues_non_validees: 0,
    total_credits_obtenus: 0
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);
  const router = useRouter();

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
            
            if (parsedAncien.statistiques) {
              setStats(parsedAncien.statistiques);
            }
            
            // Utiliser les infos de l'étape 2 (sélection parcours)
            const step2Data = localStorage.getItem("inscription_step2");
            if (step2Data) {
              const parsedStep2 = JSON.parse(step2Data);
              setInfosPedagogiques(parsedStep2);
              // Pour anciens étudiants : utiliser les UE déjà filtrées par le backend
              fetchUEsForAncienEtudiant(parsedAncien);
            } else if (parsedAncien.prochaine_annee) {
              // Fallback sur données anciennes
              const mockStep2 = {
                parcours_id: parsedAncien.derniere_inscription.parcours.id,
                filiere_id: parsedAncien.derniere_inscription.filiere.id,
                annee_etude_id: parsedAncien.prochaine_annee.id,
                parcours_libelle: parsedAncien.derniere_inscription.parcours.libelle,
                filiere_nom: parsedAncien.derniere_inscription.filiere.nom,
                annee_etude_libelle: parsedAncien.prochaine_annee.libelle,
              };
              setInfosPedagogiques(mockStep2);
              fetchUEsForAncienEtudiant(parsedAncien);
            }
            return;
          }
        }
      }
      
      // NOUVEAUX ÉTUDIANTS
      const step1Data = localStorage.getItem("inscription_step1");
      const step2Data = localStorage.getItem("inscription_step2");
      
      if (!step1Data || !step2Data) {
        setError("Les données d'inscription sont incomplètes. Veuillez recommencer depuis l'étape 1.");
        router.push("/etudiant/inscription/etape-1");
        return;
      }
      
      const parsedStep2 = JSON.parse(step2Data);
      setInfosPedagogiques(parsedStep2);
      
      // Charger les UE pour tous les niveaux précédents + actuel
      fetchUEsForNewStudent(parsedStep2);
    };
    
    loadAllData();
  }, [router]);

  /**
   * NOUVEAUX ÉTUDIANTS : Charger UE de tous les niveaux précédents + actuel
   */
  // src/features/etudiant/inscription/etape-4/NouvelEtudiantStep4.js (extrait corrigé)

const fetchUEsForNewStudent = async (params) => {
  setLoading(true);
  setError("");

  try {
    console.log("=== DÉBUT fetchUEsForNewStudent ===");
    console.log("Params reçus:", params);

    const anneeLibelle = params.annee_etude_libelle;

    console.log(" Année sélectionnée:", anneeLibelle);

    if (!anneeLibelle) {
      console.error(" Pas de libellé d'année disponible");
      toast.error("Erreur: année d'étude non définie");
      const response = await api.get("/notes/ues/filtrer/", {
        params: {
          parcours: params.parcours_id,
          filiere: params.filiere_id,
          annee_etude: params.annee_etude_id,
        }
      });
      const uesData = inscriptionService._normalizeResponse(response.data);
      const uesEnrichies = enrichUEsData(uesData);
      const sortedUes = sortUEs(uesEnrichies);
      setUes(sortedUes);
      setLoading(false);
      return;
    }

    // Mode multi-niveaux
    const result = await inscriptionService.getUEs(
      {
        parcours: params.parcours_id,
        filiere: params.filiere_id,
        annee_etude: params.annee_etude_id,
      },
      {
        isNewStudent: true,
        anneeLibelle: anneeLibelle
      }
    );

    // Correction clé : extraire le tableau ues
    const uesArray = result.ues || [];
    console.log(" UE reçues:", uesArray.length);

    const uesEnrichies = enrichUEsData(uesArray);
    const sortedUes = sortUEs(uesEnrichies);
    setUes(sortedUes);

    const niveauxCharges = [...new Set(sortedUes.map(ue => ue.annee_info?.libelle))].filter(Boolean);
    console.log(" Niveaux chargés:", niveauxCharges);

    if (niveauxCharges.length > 1) {
      toast.success(` UE chargées : ${niveauxCharges.join(', ')}`, { duration: 4000 });
    } else if (niveauxCharges.length === 1) {
      toast.success(` UE chargées : ${niveauxCharges[0]}`, { duration: 3000 });
    }

    console.log("=== FIN fetchUEsForNewStudent ===");

  } catch (err) {
    console.error(" Erreur fetchUEsForNewStudent:", err);
    setError("Erreur lors de la récupération des UE. Veuillez réessayer.");
    toast.error("Erreur lors du chargement des UE");
  } finally {
    setLoading(false);
  }
};

  /**
   * ANCIENS ÉTUDIANTS : Utiliser les UE déjà filtrées
   */
  const fetchUEsForAncienEtudiant = async (ancienData) => {
    setLoading(true);
    setError("");
    try {
      if (!ancienData.ues_disponibles || ancienData.ues_disponibles.length === 0) {
        setError("Aucune UE disponible. Contactez l'administration.");
        return;
      }
      
      const uesCorrigees = ancienData.ues_disponibles.map(ue => ({
        ...ue,
        semestre: ue.semestre || { libelle: "Semestre non défini" }
      }));
      
      const uesEnrichies = enrichUEsData(uesCorrigees);
      const sortedUes = sortUEs(uesEnrichies);
      
      setUes(sortedUes);
    } catch (err) {
      setError("Erreur lors de la récupération des UE. Veuillez réessayer.");
      console.error("Erreur fetchUEsForAncienEtudiant:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enrichir les UE avec les composantes
   */
  const enrichUEsData = (uesData) => {
    return uesData.map(ue => {
      if (ue.composite && ue.ues_composantes && ue.ues_composantes.length > 0) {
        if (typeof ue.ues_composantes[0] === 'number') {
          ue.ues_composantes = uesData.filter(u => ue.ues_composantes.includes(u.id));
        }
      }
      return ue;
    });
  };

  /**
   * Trier les UE par semestre et code
   */
  const sortUEs = (ues) => {
    return ues.sort((a, b) => {
      const semestreA = a.semestre?.ordre || a.semestre || 0;
      const semestreB = b.semestre?.ordre || b.semestre || 0;
      if (semestreA !== semestreB) {
        return semestreA - semestreB;
      }
      return (a.code || '').localeCompare(b.code || '');
    });
  };

  const handleCheckboxChange = (ueId, isComposite = false, composantesIds = []) => {
    const ue = ues.find(u => u.id === ueId);
    if (!ue) return;
    
    const idsToToggle = isComposite ? [ueId, ...composantesIds] : [ueId];
    
    setSelectedUEs((prev) => {
      const newSelected = { ...prev };
      const isSelecting = !prev[ueId];
      
      if (isSelecting) {
        const creditsDesToggle = ues
          .filter(u => idsToToggle.includes(u.id))
          .reduce((sum, u) => sum + u.nbre_credit, 0);
        
        const totalCreditsActuels = ues
  .filter(u => prev[u.id] && !idsToToggle.includes(u.id))  // inchangé
  .reduce((sum, u) => sum + (u.composite ? 0 : u.nbre_credit), 0);  
        
        if (totalCreditsActuels + creditsDesToggle > LIMITE_CREDITS_MAX) {
          setError(`Impossible d'ajouter cette UE : limite de ${LIMITE_CREDITS_MAX} crédits dépassée.`);
          return prev;
        }
      }
      
      idsToToggle.forEach(id => {
        newSelected[id] = !prev[id];
      });
      
      if (error && error.includes("dépassée")) {
        setError("");
      }
      
      return newSelected;
    });
  };

  const totalCreditsSelectionnes = ues
  .filter((ue) => selectedUEs[ue.id]) // toutes les UE sélectionnées
  .reduce((sum, ue) => {
    // Si c'est une composante et que sa composite est sélectionnée, on ignore
    if (ue.parentUE && selectedUEs[ue.parentUE]) return sum;
    return sum + ue.nbre_credit;
  }, 0);


  const getCreditColor = (credits) => {
    if (credits > LIMITE_CREDITS_MAX) return "text-red-600";
    if (credits > LIMITE_CREDITS_MAX * 0.8) return "text-orange-600";
    return "text-green-600";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const selectedUEIds = Object.keys(selectedUEs)
      .filter((id) => selectedUEs[id])
      .map(Number)
      .filter(id => {
        const ue = ues.find(u => u.id === id);
        return !ue?.composite;
      });
      
    if (selectedUEIds.length === 0) {
      setError("Vous devez sélectionner au moins une UE.");
      return;
    }
    
    const totalCredits = ues
      .filter((ue) => selectedUEIds.includes(ue.id))
      .reduce((sum, ue) => sum + ue.nbre_credit, 0);
      
    if (totalCredits > LIMITE_CREDITS_MAX) {
      setError(`Total de ${totalCredits} crédits dépasse la limite de ${LIMITE_CREDITS_MAX}.`);
      return;
    }
    
    setPendingSubmitData({ selectedUEIds, totalCredits });
    setShowConfirmModal(true);
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setPendingSubmitData(null);
  };

  const base64ToFile = (base64, filename = "photo.jpg") => {
    if (!base64) return null;
    try {
      const [header, data] = base64.split(',');
      const byteString = atob(data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      return new File([ab], filename, { type: header.match(/:(.*?);/)[1] });
    } catch (e) {
      return null;
    }
  };

const handleConfirmInscription = async () => {
  setShowConfirmModal(false);
  setLoading(true);
  setError("");

  const loadingToast = toast.loading("Inscription en cours...");

  try {
    const step1 = JSON.parse(localStorage.getItem("inscription_step1"));
    const step2 = JSON.parse(localStorage.getItem("inscription_step2"));
    const selectedUEIds = pendingSubmitData.selectedUEIds;

    //  ÉTAPE 1 : MISE À JOUR DU PROFIL (JSON avec photo Base64)
    const profilData = {
      telephone: step1.telephone
    };

    // Ajouter la photo en Base64 si elle existe
    if (step1.photoBase64) {
      profilData.photo = step1.photoBase64; // "data:image/jpeg;base64,..."
    }

    // Champs pour NOUVEAUX étudiants uniquement
    if (typeInscription?.typeEtudiant !== 'ancien') {
      if (step1.date_naiss) profilData.date_naiss = step1.date_naiss;
      if (step1.lieu_naiss) profilData.lieu_naiss = step1.lieu_naiss;
      if (step1.autre_prenom) profilData.autre_prenom = step1.autre_prenom;
      if (step1.num_carte) profilData.num_carte = step1.num_carte;
      if (step1.sexe) profilData.sexe = step1.sexe;
    }

    // 🚀 ENVOI PROFIL (JSON)
    await api.patch('/inscription/update-profil/', profilData);

    // ✅ ÉTAPE 2 : INSCRIPTION PÉDAGOGIQUE (JSON)
    if (typeInscription?.typeEtudiant === 'ancien') {
      await api.post('/inscription/ancien-etudiant/', {
        etudiant_id: ancienEtudiantData.etudiant.id,
        prochaine_annee_id: step2.annee_etude_id,
        ues_selectionnees: selectedUEIds
      });
    } else {
      await api.post('/inscription/nouveau/', {
        parcours_id: step2.parcours_id,
        filiere_id: step2.filiere_id,
        annee_etude_id: step2.annee_etude_id,
        ues_selectionnees: selectedUEIds
      });
    }

    // Nettoyage
    localStorage.removeItem('inscription_step1');
    localStorage.removeItem('inscription_step2');
    localStorage.removeItem('type_inscription');
    localStorage.removeItem('ancien_etudiant_complet');

    toast.success("🎉 Inscription réussie !", { duration: 5000 });
    router.push('/etudiant/dashboard/donnees-personnelles');

  } catch (err) {
    console.error("❌ Erreur inscription:", err);
    const msg = err.response?.data?.error 
      || err.response?.data?.detail
      || err.message 
      || "Erreur lors de l'inscription";
    setError(msg);
    toast.error(msg);
  } finally {
    toast.dismiss(loadingToast);
    setLoading(false);
    setPendingSubmitData(null);
  }
};

  const modalData = {
    type: typeInscription?.typeEtudiant === 'ancien' ? 'Ancien étudiant' : 'Nouveau étudiant',
    infos: infosPedagogiques,
    uesCount: pendingSubmitData?.selectedUEIds?.length || 0,
    totalCredits: pendingSubmitData?.totalCredits || 0,
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-transparent  "
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-800">
          {typeInscription?.typeEtudiant === 'ancien' ? 'Inscription année suivante' : 'Sélection des UE'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {typeInscription?.typeEtudiant === 'ancien' && ancienEtudiantData && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-xs text-blue-600 font-semibold">PROCHAINE ANNÉE</p>
              <p className="text-lg font-bold text-blue-900">{ancienEtudiantData.prochaine_annee?.libelle}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <p className="text-xs text-indigo-600 font-semibold">UE VALIDÉES</p>
              <p className="text-lg font-bold text-indigo-900">{stats.ues_validees}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
              <p className="text-xs text-amber-600 font-semibold">UE NON VALIDÉES</p>
              <p className="text-lg font-bold text-amber-900">{stats.ues_non_validees}</p>
            </div>
          </div>
        )}
        
        {typeInscription?.typeEtudiant !== 'ancien' && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400">
              <p className="text-xs text-slate-600 font-semibold">FILIÈRE</p>
              <p className="text-sm font-bold text-slate-800">{infosPedagogiques.filiere_nom}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400">
              <p className="text-xs text-slate-600 font-semibold">PARCOURS</p>
              <p className="text-sm font-bold text-slate-800">{infosPedagogiques.parcours_libelle}</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400">
              <p className="text-xs text-slate-600 font-semibold">ANNÉE</p>
              <p className="text-sm font-bold text-slate-800">{infosPedagogiques.annee_etude_libelle}</p>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-600">Crédits sélectionnés</p>
              <p className={`text-2xl font-bold ${getCreditColor(totalCreditsSelectionnes)}`}>
                {totalCreditsSelectionnes}/{LIMITE_CREDITS_MAX}
              </p>
            </div>
            <div className="text-right">
              {totalCreditsSelectionnes > LIMITE_CREDITS_MAX && (
                <p className="text-red-600 text-xs font-semibold">Dépassement limite</p>
              )}
            </div>
          </div>
        </div>
        
        <UETable
          ues={ues}
          selectedUEs={selectedUEs}
          loading={loading}
          onCheckboxChange={handleCheckboxChange}
          totalCreditsSelectionnes={totalCreditsSelectionnes}
          LIMITE_CREDITS_MAX={LIMITE_CREDITS_MAX}
        />
        
        <div className="flex justify-between mt-8 gap-4">
          <Link
            href="/"
            className="bg-red-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-all text-center text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || ues.length === 0 || totalCreditsSelectionnes > LIMITE_CREDITS_MAX}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? "Enregistrement..." : "Finaliser inscription"}
          </button>
        </div>
      </form>
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        data={modalData}
        onConfirm={handleConfirmInscription}
        onCancel={handleCancelModal}
        limitCredits={LIMITE_CREDITS_MAX}
      />
    </>
  );
}