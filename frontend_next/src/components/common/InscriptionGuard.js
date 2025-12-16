"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook de protection pour les pages d'inscription
 * NOUVEAU FLUX : Tous les étudiants commencent à l'étape 1 (infos personnelles)
 */
export function useInscriptionGuard(etapeRequise) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifierAcces = () => {
      try {
        // 1. Vérifier authentification
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        
        if (!userStr || !token) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        
        // 2. Vérifier rôle étudiant
        if (user.role !== 'etudiant') {
          router.push('/');
          return;
        }

        // 3. Vérification des étapes précédentes (progression linéaire)
        if (etapeRequise === 1) {
          // Étape 1 accessible directement après connexion
          setAuthorized(true);
          return;
        }

        if (etapeRequise === 2) {
          // Étape 2 nécessite étape 1 complétée
          const step1 = localStorage.getItem('inscription_step1');
          if (!step1) {
            router.replace('/etudiant/inscription/etape-1');
            return;
          }
        }

        if (etapeRequise === 3) {
          // Étape 3 nécessite étapes 1 et 2 complétées
          const step1 = localStorage.getItem('inscription_step1');
          const step2 = localStorage.getItem('inscription_step2');
          
          if (!step1) {
            router.replace('/etudiant/inscription/etape-1');
            return;
          }
          
          if (!step2) {
            router.replace('/etudiant/inscription/etape-2');
            return;
          }
        }

        setAuthorized(true);
        
      } catch (err) {
        console.error("Erreur vérification accès:", err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    verifierAcces();
  }, [router, etapeRequise]);

  return { authorized, loading };
}

/**
 * Composant wrapper pour protéger les pages d'inscription
 */
export function InscriptionGuard({ children, etape }) {
  const { authorized, loading } = useInscriptionGuard(etape);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Vérification des autorisations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}