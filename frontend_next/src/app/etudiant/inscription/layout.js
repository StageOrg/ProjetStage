"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Header from '@/components/ui/Header';
import periodeInscriptionService from '@/services/inscription/periodeInscriptionService';
import { Clock, Lock, AlertCircle } from 'lucide-react';

function Stepper({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-6 mb-10">
      {[1, 2, 3, 4].map((etape) => (
        <div key={etape} className="flex flex-col items-center">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${
            etape === currentStep 
              ? 'border-blue-700 bg-blue-100 text-blue-700' 
              : etape < currentStep
                ? 'border-green-500 bg-green-100 text-green-500'
                : 'border-gray-300 bg-white text-gray-400'
          } font-bold text-lg transition-all`}>
            {etape < currentStep ? '✓' : etape}
          </div>
          {etape <= 4 && (
            <div className={`w-12 h-1 mt-1 mb-1 rounded ${
              etape < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function LoadingVerification() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Vérification en cours...
        </h3>
        <p className="text-gray-600 text-sm">
          Nous vérifions l'état des inscriptions
        </p>
      </div>
    </div>
  );
}

// Composant affiché quand les inscriptions sont fermées
function InscriptionsFermees() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-2xl text-gray-800 mb-4">
          Inscriptions indisponibles. Veuillez contacter l'administration.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export default function InscriptionLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // États pour la protection
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [statutInfo, setStatutInfo] = useState(null);

  // Vérification du statut au montage du composant
  useEffect(() => {
    verifierAccesInscription();
  }, []);

  const verifierAccesInscription = async () => {
    try {
      // Appel au service pour vérifier le statut
      const statut = await periodeInscriptionService.verifierStatutInscriptions();
      
      setStatutInfo(statut);

      // Si les inscriptions ne sont PAS ouvertes
      if (!statut.ouvert) {
        setCanAccess(false);
      } else {
        // Inscriptions ouvertes, accès autorisé
        setCanAccess(true);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      // En cas d'erreur, on bloque l'accès par sécurité
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // Pendant la vérification, afficher le loader
  if (loading) {
    return <LoadingVerification />;
  }

  // Si pas d'accès, afficher le message directement
  if (!canAccess) {
    return <InscriptionsFermees />;
  }

  // Détermine l'étape actuelle depuis l'URL
  const getCurrentStep = () => {
    if (pathname.includes('etape-0')) return 0;
    if (pathname.includes('etape-1')) return 1;
    if (pathname.includes('etape-2')) return 2;
    if (pathname.includes('etape-3')) return 3;
    if (pathname.includes('etape-4')) return 4;
    return 0;
  };

  const currentStep = getCurrentStep();

  const handleBack = () => {
    if (currentStep === 0) {
      router.push('/');
    } else if (currentStep === 1) {
      router.push('/etudiant/inscription/etape-0');
    } else {
      router.push(`/etudiant/inscription/etape-${currentStep - 1}`);
    }
  };

  // Si on est à l'étape 0, pas besoin du stepper
  const showStepper = currentStep > 0;

  return (
    <>
      <Header />
      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-50 min-h-screen font-sans pt-16">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {showStepper ? (
            <>
              <div className="flex items-center mb-4">
                <div className="w-1/3">
                  <button 
                    onClick={handleBack}
                    className="text-blue-900 font-semibold hover:text-blue-800 transition-colors underline">
                    Étape précédente
                  </button>
                </div>
                
                <div className="w-1/3 flex justify-center">
                  <Stepper currentStep={currentStep} />
                </div>
                
                <div className="w-1/3"></div>
              </div>
            </>
          ) : (
            // Message d'information pour l'étape 0
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-semibold text-sm">
                    ✅ Les inscriptions sont ouvertes
                  </p>
                  {statutInfo?.periode && (
                    <p className="text-green-700 text-xs mt-1">
                      Période valide jusqu'au {new Date(statutInfo.periode.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-2">
            {children}
          </div>
          
          {showStepper && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Étape {currentStep} sur 4
            </div>
          )}
        </div>
      </div>
    </>
  );
}