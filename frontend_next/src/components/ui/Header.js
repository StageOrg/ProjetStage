"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import AnneeAcademiqueService from "@/services/anneeAcademiqueService";
import periodeInscriptionService from "@/services/inscription/periodeInscriptionService";


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [annees, setAnnees] = useState([]);
  const [anneeChoisie, setAnneeChoisie] = useState(null);
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
        return "/secretariat/dashboard/ue-exam";
      case "responsable inscriptions":
        return "/resp-inscriptions/dashboard";
      case "resp_notes":
        return "/resp-notes/dashboard";
      case "gestionnaire":
        return "gestion/dashboard"
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

  const PersonnelSaisieMenu = [
    { label: "Accueil", href: "/" },
    { label: "Nos Professeurs", href: "/nos-profs" },
    { label: "Nos programmes", href: "/programmes" },
    { label: "Contactez-nous", href: "/contact" },
    { label: "Personnel", href: personnelHref },
  ];
  // Sélectionner menu selon rôle : si c'est professeur, afficher menu personnel, sinon PersonnelSaisieMenu; mais si c'est visiteur, afficher baseMenu
  const menuItems = (() => {
    if (role === "visiteur" || !role) return baseMenu;
    if (role === "professeur") return personnelMenu;
    return PersonnelSaisieMenu;
  })();

  // Redirections protégées
  const handleProtectedRoute = (href) => {
    localStorage.setItem("etudiant_redirect", href);
    router.push("/login");
  };

  const handleProtectedPersonnel = (href) => {
    localStorage.setItem("personnel_redirect", href);
    router.push("/login");
  };
  useEffect(() => {
    AnneeAcademiqueService.getAll()
    .then((data) => setAnnees(data))
    .catch((error) => console.error("Erreur lors du chargement des années académiques :", error));
  }, []);
  useEffect(() => {
    if (annees.length > 0) {
      setAnneeChoisie(annees[0]);
      localStorage.setItem("annee_id", annees[0].id);
      console.log("Année académique choisie :", annees[0]);
    }
  }, [annees]);
  const onChange = (e) => {
    const selectedId = e.target.value;
    const selectedAnnee = annees.find((annee) => annee.id.toString() === selectedId);
    setAnneeChoisie(selectedAnnee);
    localStorage.setItem("annee_id", selectedAnnee.id);
    console.log("Année académique choisie :", selectedAnnee);
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
                role === "gestionnaire" ||
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
                    <FaChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`}
                    />
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
          {role !== "visiteur" && (
          <div className="h-6  " >
            <select
              onChange={(e) => {
                onChange(e);}}
              className="block w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
            >
              {annees.map((annee) => (
              <option key={annee.id} value={annee.id} >
                {annee.libelle}
              </option>
              ))}
            </select>
          </div>
          )}
          {/* Bouton Deconnexion */}
          {role !== "visiteur" ? (
            <Link
              href="/logout"
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-1"
            >
              Deconnexion
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-1"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}