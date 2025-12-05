"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  FaUserGraduate, 
  FaChartBar, 
  FaBook, 
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaChartLine,
  FaUserSlash,
  FaBalanceScale
} from "react-icons/fa";

// Simulation des services (à remplacer par les vrais imports)
const authAPI = {
  logout: async (param) => {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
};

const statisticsLinks = [
  { 
    href: "/resp_inscription/dashboard/statistiques/statistiqueInscription", 
    label: "Statistiques Inscription", 
    icon: <FaChartBar />,
    description: "Vue globale & par année"
  },
  { 
    href: "/resp_inscription/dashboard/statistiques/statistiqueAbandon", 
    label: "Taux d'Abandon", 
    icon: <FaUserSlash />,
    description: "Abandon par niveau & filière"
  },
  { 
    href: "/resp_inscription/dashboard/statistiques/statistiqueEvolution", 
    label: "Évolution & Tendances", 
    icon: <FaChartLine />,
    description: "Mensuelle & Annuelle"
  },
  /*{ 
    href: "/resp_inscription/dashboard/statistiques/statistiqueComparative", 
    label: "Analyses Comparatives", 
    icon: <FaBalanceScale />,
    description: "Comparaisons détaillées"
  },*/
];

const mainLinks = [
  { 
    href: "/resp_inscription/dashboard/gestionEtudiant", 
    label: "Gestion étudiants", 
    icon: <FaUserGraduate /> 
  },
  { 
    href: "/resp_inscription/dashboard/periodeInscription", 
    label: "Gestion Période Inscription", 
    icon: <FaBook /> 
  },
  { 
    href: "/resp_inscription/dashboard/inscription", 
    label: "Inscription Étudiants", 
    icon: <FaBook /> 
  },
];

export default function MenuLateralRespInscription() {
  const pathname = usePathname();
  const router = useRouter();
  const [isStatsOpen, setIsStatsOpen] = useState(
    pathname?.includes('/statistique') || false
  );

  const handleLogout = async () => {
    try {
      await authAPI.logout(false);
      
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user");
      localStorage.removeItem("annee_id");
      localStorage.removeItem("authToken");
      
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      localStorage.clear();
      router.push("/");
    }
  };

  const isStatisticsActive = pathname?.includes('/statistique');

  return (
    <aside className="hidden md:flex flex-col gap-3 bg-white backdrop-blur-2xl shadow-2xl w-64 h-screen sticky top-0 z-10 py-0 px-0 border-r border-blue-500/50">
      <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-300 text-xl tracking-tight drop-shadow-lg">
            EPL
          </span>
          <span className="bg-blue-900/80 text-blue-200 font-bold px-2 py-0.5 rounded-md text-xs shadow-md">
            Resp. Inscription
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 text-base font-medium">
          {/* Liens principaux */}
          {mainLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                (pathname === link.href
                  ? "bg-transparent text-black font-semibold shadow-md border-l-2 border-blue-400"
                  : "text-black hover:bg-gray-800/50 hover:text-white ") +
                " px-3 py-2 transition-all duration-200 flex items-center gap-3 rounded-md"
              }
            >
              <span className="text-lg flex-shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </Link>
          ))}

          {/* Menu Statistiques avec Dropdown */}
          <div className="mt-1">
            <button
              onClick={() => setIsStatsOpen(!isStatsOpen)}
              className={
                (isStatisticsActive
                  ? "bg-transparent text-black font-semibold shadow-md border-l-2 border-blue-400"
                  : "text-black hover:bg-gray-800/50 hover:text-white ") +
                " w-full px-3 py-2 transition-all duration-200 flex items-center justify-between gap-3 rounded-md"
              }
            >
              <div className="flex items-center gap-3">
                <FaChartBar className="text-lg flex-shrink-0" />
                <span className="truncate">Statistiques</span>
              </div>
              {isStatsOpen ? (
                <FaChevronUp className="text-sm" />
              ) : (
                <FaChevronDown className="text-sm" />
              )}
            </button>

            {/* Sous-menu Statistiques */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isStatsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-gray-200 pl-2">
                {statisticsLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      (pathname === link.href
                        ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-500"
                        : "text-gray-700 hover:bg-gray-100 hover:text-blue-600 border-l-2 border-transparent") +
                      " px-3 py-2 transition-all duration-200 flex flex-col gap-0.5 rounded-md text-sm"
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{link.icon}</span>
                      <span className="font-medium">{link.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 ml-6">
                      {link.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Bouton Déconnexion */}
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 mt-4 text-center select-none opacity-75">
          &copy; EPL {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}