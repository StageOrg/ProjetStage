// frontend_next/src/features/etudiant/dashboard/statistiques/NavbarRetourAccueil.js
"use client";
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useState, useEffect } from 'react';

export default function NavbarRetourAccueil() {
  const router = useRouter();
  const [user, setUser] = useState({
    last_name: "",
    first_name: "",
    username: "",
    loading: true
  });

  useEffect(() => {
    // Récupérer les données utilisateur stockées après connexion
    const storedUser = localStorage.getItem('userData');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser({
        last_name: userData.last_name || "",
        first_name: userData.first_name || "",
        username: userData.username || "utilisateur",
        loading: false
      });
    } else {
      // Si pas de données stockées (cas rare, devrait être géré au login)
      setUser({ last_name: "Utilisateur", first_name: "", username: "utilisateur", loading: false });
    }
  }, []);

  const handleBack = () => {
    router.push("/");
  };

  // Déterminer le nom à afficher (priorité : last_name first_name, sinon username)
  const displayName = user.last_name || user.first_name 
    ? `${user.last_name} ${user.first_name}`.trim() 
    : user.username;

  return (
    <nav className="text-white flex justify-between items-center px-4 py-5 shadow-sm border-b border-blue-500 bg-blue-900">
      {/* Bouton retour */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-all duration-200"
        onClick={handleBack}
      >
        <ArrowLeft className="w-4 h-4 text-blue-100" />
        <span className="font-semibold text-blue-100 text-sm">Retour à l'accueil</span>
      </div>

      {/* Informations utilisateur */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          {user.loading ? (
            <span className="font-bold text-sm block uppercase tracking-wide animate-pulse">
              Chargement...
            </span>
          ) : (
            <span className="font-bold text-sm block uppercase tracking-wide">
              {displayName}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}