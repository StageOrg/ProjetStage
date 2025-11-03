"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaUserGraduate, FaChartBar, FaBook, FaSignOutAlt } from "react-icons/fa";
import { authAPI } from "@/services/authService";

const links = [
  { href: "/resp_inscription/dashboard/gestionEtudiant", label: "Gestion étudiants", icon: <FaUserGraduate /> },
  { href: "/resp_inscription/dashboard/statistiqueInscription", label: "Statistiques Inscription", icon: <FaChartBar /> },
  { href: "/resp_inscription/dashboard/periodeInscription", label: "Gestion Période Inscription", icon: <FaBook /> },
];

export default function MenuLateralRespInscription() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Appeler la méthode logout de authAPI
      await authAPI.logout(false);
      
      // Nettoyer le localStorage
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user");
      localStorage.removeItem("annee_id");
      localStorage.removeItem("authToken");
      
     
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même en cas d'erreur, nettoyer et rediriger
      localStorage.clear();
      router.push("/");
    }
  };

  return (
    <aside className="hidden md:flex flex-col gap-3 bg-black/90 backdrop-blur-2xl shadow-2xl w-64 h-screen sticky top-0 z-10 py-0 px-0 border-r border-blue-500/50">
      <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-300 text-xl tracking-tight drop-shadow-lg">EPL</span>
          <span className="bg-blue-900/80 text-blue-200 font-bold px-2 py-0.5 rounded-md text-xs shadow-md">Responsable Inscription</span>
        </div>

        <nav className="flex flex-col gap-1 text-base font-medium">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                (pathname === link.href
                  ? "bg-blue-900/50 text-white font-semibold shadow-md border-l-2 border-blue-400"
                  : "text-gray-300 hover:bg-gray-800/50 hover:text-white ") +
                " px-3 py-2 transition-all duration-200 flex items-center gap-3 rounded-md"
              }
            >
              <span className="text-lg flex-shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4 text-center select-none opacity-75">
          &copy; EPL {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}