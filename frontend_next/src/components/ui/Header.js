"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import periodeInscriptionService from "@/services/inscription/periodeInscriptionService";


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [role, setRole] = useState("visiteur");
  const [inscriptionLink, setInscriptionLink] = useState("/etudiant/inscription/etape-0");


  // Charger rôle depuis localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);
  useEffect(() => {
  const fetchPeriode = async () => {
    if (role === "etudiant") {
      const statut = await periodeInscriptionService.verifierStatutInscriptions();
      if (!statut.ouvert) {
        // Si période fermée ou expirée, redirige vers page FinInscription
        setInscriptionLink("/etudiant/inscription/inscriptionCloturee");
      } else {
        setInscriptionLink("/etudiant/inscription/etape-0");
      }
    }
  };
  fetchPeriode();
}, [role]);


  // Déterminer la route du menu Personnel selon rôle
  const getPersonnelHref = (role) => {
    switch (role) {
      case "admin":
        return "/admin/dashboard";
      case "professeur":
        return "/prof/dashboard";
      case "secretaire":
        return "/secretaire/dashboard";
      case "responsable inscriptions":
        return "/resp-inscriptions/dashboard";
      case "resp_notes":
        return "/resp-notes/dashboard";
      default:
        return "/";
    }
  };

  const personnelHref = getPersonnelHref(role);

  // Menus pour tout le monde
  const baseMenu = [
    { label: "Accueil", href: "/" },
    { label: "Nos Professeurs", href: "/nos-profs" },
    {
      label: "Étudiant",
      children: [
        { label: "Inscriptions", href: inscriptionLink },
        {
          label: "Données personnelles",
          protected: true,
          href: "/etudiant/dashboard/donnees-personnelles",
        },
        { label: "Notes", protected: true, href: "/etudiant/dashboard/notes" },
        {
          label: "Statistiques",
          protected: true,
          href: "/etudiant/dashboard/statistiques",
        },
      ],
    },
    { label: "Nos programmes", href: "/programmes" },
    { label: "Contactez-nous", href: "/contact" },
  ];

  // Menus quand c’est un membre du personnel
  const personnelMenu = [
    { label: "Accueil", href: "/" },
    { label: "Nos Professeurs", href: "/nos-profs" },
    { label: "Nos programmes", href: "/programmes" },
    { label: "Contactez-nous", href: "/contact" },
    { label: "Personnel", href: personnelHref },
    { label: "Service examen", href: "/service-examen/notes/mes-ues" },
  ];

  // Sélectionner menu selon rôle
  const menuItems =
    role === "admin" ||
    role === "professeur" ||
    role === "secretaire" ||
    role === "responsable inscriptions" ||
    role === "resp_notes"
      ? personnelMenu
      : baseMenu;

  // Redirections protégées
  const handleProtectedRoute = (href) => {
    localStorage.setItem("etudiant_redirect", href);
    router.push("/login");
  };

  const handleProtectedPersonnel = (href) => {
    localStorage.setItem("personnel_redirect", href);
    router.push("/login");
  };

  return (
    <header className="w-full bg-white/80 backdrop-blur-md shadow fixed top-0 left-0 z-20 px-4 sm:px-8 py-3 h-16">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="font-extrabold text-blue-800 text-2xl tracking-wide"
        >
          <img src="/images/logo-epl.png" className="h-10 w-auto" />
        </Link>

        {/* Menu principal */}
        <nav className="hidden sm:flex gap-6 font-semibold relative items-center">
          {menuItems.map((item) => {
            const hasChildren = !!item.children;
            let isActive = pathname === item.href;

            // Forcer l'activation du menu "Personnel"
            if (
              (role === "admin" ||
                role === "professeur" ||
                role === "secretaire" ||
                role === "responsable inscriptions" ||
                role === "resp_notes") &&
              item.label === "Personnel"
            ) {
              isActive = true;
            }

            return (
              <div
                key={item.label}
                className="relative group"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {/* Lien ou bouton principal */}
                {hasChildren ? (
                  <button
                    className={`px-3 py-2 rounded transition flex items-center gap-1 ${
                      isActive
                        ? "text-blue-700 font-bold bg-blue-100/70"
                        : "text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {item.label}
                    <span className="text-xs">▼</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`px-3 py-2 rounded transition flex items-center gap-1 ${
                      isActive
                        ? "text-blue-700 font-bold bg-blue-100/70"
                        : "text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Sous-menu */}
                {hasChildren && openDropdown === item.label && (
                  <div className="absolute top-full left-0 bg-white shadow-md w-56 z-30">
                    {item.children.map((child) => {
                      if (child.protected) {
                        return (
                          <button
                            key={child.label}
                            onClick={() =>
                              role !== "visiteur"
                                ? handleProtectedPersonnel(child.href)
                                : handleProtectedRoute(child.href)
                            }
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-800 transition"
                          >
                            {child.label}
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-800 transition"
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bouton Connexion */}
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-1"
          >
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
