"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import inscriptionService from "@/services/inscription/inscriptionService";
import registrationService from "@/services/inscription/registrationService";
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import UETable from '@/components/ui/ueTable'; // utilise le composant UETable centralisé

const LIMITE_CREDITS_MAX = 70;

export default function NouvelEtudiantStep4() {
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

  const nettoyerDonneesStep2 = (step2Data) => {
    const nettoye = { ...step2Data };
   
    if (!nettoye.num_carte || nettoye.num_carte.trim() === '' || isNaN(parseInt(nettoye.num_carte, 10))) {
      nettoye.num_carte = null;
    } else {
      nettoye.num_carte = parseInt(nettoye.num_carte.trim(), 10);
    }  
    return nettoye;
  };

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
              fetchUEsForAncienEtudiant(parsedAncien);
              return;
            }
          }
        }
      }

      const step1Data = localStorage.getItem("inscription_step1");
      const step2Data = localStorage.getItem("inscription_step2");
      const step3Data = localStorage.getItem("inscription_step3");
      
      if (!step1Data || !step2Data || !step3Data) {
        setError("Les données d'inscription sont incomplètes. Veuillez recommencer depuis l'étape 1.");
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
    setError("");
    try {
      const response  = await inscriptionService.getUEs({
        parcours: params.parcours_id,
        filiere: params.filiere_id,
        annee_etude: params.annee_etude_id,
      });
      
      const uesData = Array.isArray(response) ? response : response.results || response;
      
      // 👇 MODIFICATION: Enrichir les UE avec les détails des composantes
      const uesEnrichies = uesData.map(ue => {
        if (ue.composite && ue.ues_composantes && ue.ues_composantes.length > 0) {
          // Si c'est juste un tableau d'IDs, récupérer les détails
          if (typeof ue.ues_composantes[0] === 'number') {
            ue.ues_composantes = uesData.filter(u => ue.ues_composantes.includes(u.id));
          }
        }
        return ue;
      });
      
      const sortedUes = uesEnrichies.sort((a, b) => {
        const semestreA = a.semestre || 0;
        const semestreB = b.semestre || 0;
        if (semestreA !== semestreB) {
          return semestreA - semestreB;
        }
        return (a.code || '').localeCompare(b.code || '');
      });
      
      setUes(sortedUes);
    } catch (err) {
      setError("Une erreur s'est produite lors de la récupération des unités d'enseignement (UE). Veuillez réessayer.");
      console.error("Erreur dans fetchUEs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUEsForAncienEtudiant = async (ancienData) => {
    setLoading(true);
    setError("");
    try {
      if (!ancienData.ues_disponibles || ancienData.ues_disponibles.length === 0) {
        setError("Aucune unité d'enseignement (UE) disponible pour cette inscription. Contactez l'administration.");
        return;
      }
      
      // 👇 MODIFICATION: Enrichir les UE avec les détails des composantes
      const uesCorrigees = ancienData.ues_disponibles.map(ue => {
        const ueCorrigee = {
          ...ue,
          semestre: ue.semestre || { libelle: "Semestre non défini" }
        };
        
        if (ueCorrigee.composite && ueCorrigee.ues_composantes && ueCorrigee.ues_composantes.length > 0) {
          if (typeof ueCorrigee.ues_composantes[0] === 'number') {
            ueCorrigee.ues_composantes = ancienData.ues_disponibles.filter(u => 
              ueCorrigee.ues_composantes.includes(u.id)
            );
          }
        }
        
        return ueCorrigee;
      });
      
      const sortedUes = uesCorrigees.sort((a, b) => {
        const semestreA = a.semestre || 0;
        const semestreB = b.semestre || 0;
        if (semestreA !== semestreB) {
          return semestreA - semestreB;
        }
        return (a.code || '').localeCompare(b.code || '');
      });
      
      setUes(sortedUes);
    } catch (err) {
      setError("Une erreur s'est produite lors de la récupération des unités d'enseignement (UE). Veuillez réessayer.");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
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
          .filter((u) => prev[u.id] && !idsToToggle.includes(u.id))
          .reduce((sum, u) => sum + u.nbre_credit, 0);
        
        if (totalCreditsActuels + creditsDesToggle > LIMITE_CREDITS_MAX) {
          const messageErreur = `Impossible d'ajouter cette UE : vous dépasseriez la limite maximale de ${LIMITE_CREDITS_MAX} crédits. Veuillez désélectionner d'autres UE pour libérer de la place.`;
          setError(messageErreur);
          return prev;
        }
      }

      idsToToggle.forEach(id => {
        newSelected[id] = !prev[id];
      });

      if (error && error.includes("dépasseriez la limite")) {
        setError("");
      }

      return newSelected;
    });
  };

  const totalCreditsSelectionnes = ues
    .filter((ue) => selectedUEs[ue.id] && !ue.composite)
    .reduce((sum, ue) => sum + ue.nbre_credit, 0);

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
      setError("Vous devez sélectionner au moins une unité d'enseignement (UE) pour continuer.");
      return;
    }

    const totalCredits = ues
      .filter((ue) => selectedUEIds.includes(ue.id))
      .reduce((sum, ue) => sum + ue.nbre_credit, 0);
      
    if (totalCredits > LIMITE_CREDITS_MAX) {
      setError(`Le total des crédits sélectionnés (${totalCredits}) dépasse la limite autorisée de ${LIMITE_CREDITS_MAX}. Veuillez ajuster votre sélection.`);
      return;
    }

    const submitData = {
      selectedUEIds,
      totalCredits,
    };

    setPendingSubmitData(submitData);
    setShowConfirmModal(true);
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
    setPendingSubmitData(null);
  };

  const handleConfirmInscription = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError("");

    try {
      if (typeInscription?.typeEtudiant === 'ancien') {
        await inscriptionService.inscriptionAncienEtudiant({
          etudiant_id: ancienEtudiantData.etudiant.id,
          prochaine_annee_id: ancienEtudiantData.prochaine_annee.id,
          ues_selectionnees: pendingSubmitData.selectedUEIds
        });
      } else {
        const step1Data = localStorage.getItem("inscription_step1");
        const step2DataRaw = localStorage.getItem("inscription_step2");
        const step3Data = localStorage.getItem("inscription_step3");

        if (!step1Data || !step2DataRaw || !step3Data) {
          throw new Error("Les données d'inscription sont incomplètes. Veuillez recommencer depuis l'étape 1.");
        }

        const allData = {
          step1: JSON.parse(step1Data),
          step2: nettoyerDonneesStep2(JSON.parse(step2DataRaw)),
          step3: JSON.parse(step3Data)
        };

        await registrationService.createCompleteRegistration(allData, pendingSubmitData.selectedUEIds);
      }

      localStorage.removeItem('inscription_step1');
      localStorage.removeItem('inscription_step2');
      localStorage.removeItem('inscription_step3');
      localStorage.removeItem('type_inscription');
      localStorage.removeItem('ancien_etudiant_complet');

      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.push('/');
      
    } catch (err) {
      console.error("Erreur inscription:", err);
      const messageErreur = err.response?.data?.message || err.response?.data?.erreur || err.message || "Une erreur inattendue s'est produite lors de la finalisation de votre inscription. Veuillez vérifier vos données et réessayer. Si le problème persiste, contactez l'administration.";
      setError(messageErreur);
    } finally {
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
        className="bg-transparent from-slate-50 to-slate-100 p-10 md:p-8 w-full max-w-none mx-auto"
      >
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-800">
          {typeInscription?.typeEtudiant === 'ancien' ? 'Inscription pour l\'année suivante' : 'Sélection des UE'}
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

        <div className="mb-6 ">
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

        {/* Utilisation du composant UETable pour afficher les UEs (simples, composites et composantes) */}
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
            href="/etudiant/inscription/etape-3"
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-all text-center text-sm"
          >
            Retour
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