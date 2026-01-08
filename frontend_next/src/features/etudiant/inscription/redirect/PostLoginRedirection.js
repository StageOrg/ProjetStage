"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import inscriptionService from "@/services/inscription/inscriptionService";
import api from "@/services/api";
import toast from 'react-hot-toast';

/**
 * Hook pour gérer la redirection post-connexion des étudiants
 * NOUVEAU FLUX : Responsable crée le compte → Étudiant complète ses infos
 */
export function usePostLoginRedirection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasExecuted = useRef(false); // Empêcher double exécution en Strict Mode

  useEffect(() => {
    // Éviter double exécution si déjà fait
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const verifierEtRediriger = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        
        if (user.role !== 'etudiant') {
          setError("Accès non autorisé");
          toast.error("Accès réservé aux étudiants");
          return;
        }

        // Vérifier si l'étudiant a un num_carte (= ancien étudiant)
        let etudiantId = null;
        
        if (user.num_carte) {
          try {
            const loadingToast = toast.loading("Vérification ...");
            const response = await inscriptionService.verifierAncienEtudiant(user.num_carte);
            toast.dismiss(loadingToast);
            
            if (response.existe) {
              etudiantId = response.etudiant.id;
              // Sauvegarder les données de l'ancien étudiant
              localStorage.setItem("ancien_etudiant_complet", JSON.stringify({
                etudiant: response.etudiant,
                derniere_inscription: response.derniere_inscription,
                prochaine_annee: response.prochaine_annee,
                ues_disponibles: response.ues_disponibles,
                ues_validees: response.ues_validees,
                statistiques: response.statistiques,
                ues_non_validees: response.ues_non_validees
              }));

              localStorage.setItem("type_inscription", JSON.stringify({
                typeEtudiant: 'ancien',
                numCarteExistant: user.num_carte,
                ancienEtudiantVerifie: true
              }));

              toast.success(`Bon retour ${response.etudiant.prenom} !`);
            } else {
              // Si le numéro de carte existe sur USER mais pas dans la table ETUDIANT (cas rare mais possible)
              setError("Erreur: Données étudiant introuvables");
              toast.error("Votre numéro de carte est inconnu. Contactez l'administration.");
              return;
            }
          } catch (err) {
            toast.dismiss();
            console.error("Erreur vérification ancien étudiant:", err);
            
            // Si erreur 404 ou étudiant non trouvé, traiter comme nouveau
            if (err.response?.status === 404) {
              localStorage.removeItem("ancien_etudiant_complet");
              localStorage.setItem("type_inscription", JSON.stringify({
                typeEtudiant: 'nouveau',
                numCarteExistant: null
              }));
              toast.success("Bienvenue ! Complétez votre profil.");
            } else {
              const msg = err.response?.data?.message || "Erreur de connexion serveur";
              setError(msg);
              toast.error(msg);
              return;
            }
          }
        } else {
          // Nouvel étudiant (pas de num_carte)
          localStorage.removeItem("ancien_etudiant_complet");
          localStorage.setItem("type_inscription", JSON.stringify({
            typeEtudiant: 'nouveau',
            numCarteExistant: null
          }));
          
          toast.success("Bienvenue ! Commencez votre inscription.");
        }

        try {
         
          if (!etudiantId) {
             const completeData = await api.get("/utilisateurs/etudiants/me/");
             etudiantId = completeData.data.id;
          }

          if (etudiantId) {
            const checkInscription = await inscriptionService.verifierInscriptionEnCours(etudiantId);
            if (checkInscription.deja_inscrit) {
              toast.success(`Vous êtes déjà inscrit pour l'année ${checkInscription.annee_academique}`);
              router.push('/etudiant/dashboard/donnees-personnelles');
              return;
            }
          }
        } catch (checkErr) {
          console.error("Erreur durant la vérification d'inscription:", checkErr);
          // On continue si cette vérification échoue, pour ne pas bloquer l'étudiant
        }

        // Si non inscrit, on redirige vers l'étape 1
        router.push('/etudiant/inscription/etape-1');

      } catch (err) {
        console.error("Erreur redirection post-login:", err);
        setError("Une erreur est survenue lors de la redirection");
        toast.error("Erreur inattendue");
      } finally {
        setLoading(false);
      }
    };

    verifierEtRediriger();
  }, [router]);

  return { loading, error };
}

/**
 * Composant de transition à afficher pendant la vérification
 */
export function PostLoginTransition() {
  const { loading, error } = usePostLoginRedirection();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Erreur
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

  return null;
}