"use client";

import HeaderConnexion from "../../components/ui/HeaderConnexion";
import MenuLateralRespInscription from "../../components/navigation/MenuLateralRespInscription";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role");

    if (!accessToken || userRole !== "resp_inscription") {
      router.push("/login?next=/resp_inscription/gestionEtudiant");
    }
  }, [router]);

  return (
    <>
      {/* Header en haut */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-600">
        <HeaderConnexion />
      </header>

      {/* Menu latéral */}
      <aside className=" fixed top-15 left-0 h-screen z-30">
        <MenuLateralRespInscription />
      </aside>

      {/* Contenu principal */}
      <main className="md:ml-64 pt-20 min-h-screen bg-white font-sans flex flex-col items-center justify-center px-4 py-12 gap-8">
        {children}
      </main>
    </>
  );
}