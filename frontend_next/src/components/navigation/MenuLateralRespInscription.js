"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaBook, FaClipboardList, FaProjectDiagram, FaFileAlt, FaChartBar, FaSignOutAlt } from "react-icons/fa";

const links = [
  { href: "/resp_inscription/dashboard/gestionEtudiant", label: "Gestion étudiants", icon: <FaUserGraduate /> },
  { href: "/resp_inscription/dashboard/statistiqueInscription", label: "Statistiques Inscription", icon: <FaChartBar /> },
  { href: "/resp_inscription/dashboard/periodeInscription", label: "Gestion Periode Inscription", icon: <FaBook /> },
];

export default function MenuLateralAdmin() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken"); 
    router.push("/login"); 
  };

  return (
    <aside className="hidden md:flex flex-col gap-3 bg-black/90 backdrop-blur-2xl shadow-2xl w-64 h-screen sticky top-0 z-10 py-0 px-0 border-r border-blue-500/50"> {/* Reduced gap, bg semi-transparent black, subtle border */}
      <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4"> 
        <div className="mb-6 flex items-center gap-2 justify-center"> {/* Reduced mb */}
          <span className="font-extrabold text-blue-300 text-xl tracking-tight drop-shadow-lg">EPL</span> {/* Smaller text, lighter blue for dark */}
          <span className="bg-blue-900/80 text-blue-200 font-bold px-2 py-0.5 rounded-md text-xs shadow-md">Responsable Inscription</span> {/* Darker badge, smaller py */}
        </div>
        <nav className="flex flex-col gap-1 text-base font-medium"> {/* Smaller text-base, reduced gap, medium font */}
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                (pathname === link.href
                  ? "bg-blue-900/50 text-white font-semibold shadow-md border-l-2 border-blue-400"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white ") +
                " px-3 py-2 transition-all duration-200 flex items-center gap-3 rounded-md"  // Reduced py, rounded for pretty, left border for active
              }
            >
              <span className="text-lg flex-shrink-0">{link.icon}</span> {/* Smaller icon */}
              <span className="truncate">{link.label}</span> {/* Truncate long labels */}
            </Link>
          ))}
        </nav>
        <div className="text-xs text-gray-500 mt-6 text-center select-none opacity-75 mt-30">&copy; EPL @ {new Date().getFullYear()}</div> {/* Restored @epl 2025 with dynamic year */}

        <div className="mt-60"> {/* mt-8 pour remonter la déconnexion après nav */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-gray-200 font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200 border border-gray-600/50"  // Dark gradient, smaller py, subtle border
          >
            <FaSignOutAlt className="w-4 h-4" /> {/* Smaller icon */}
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}