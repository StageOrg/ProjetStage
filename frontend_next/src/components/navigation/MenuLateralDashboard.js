"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaSignOutAlt, FaUser, FaChartBar, FaClipboardList } from "react-icons/fa";
import { authAPI } from "@/services/authService";

const links = [
  {
    href: "/etudiant/dashboard/donnees-personnelles",
    label: "Données personnelles",
    icon: <FaUser className="w-4 h-4" />,
  },
  {
    href: "/etudiant/dashboard/statistiques",
    label: "Statistiques",
    icon: <FaChartBar className="w-4 h-4" />,
  },
  {
    href: "/etudiant/dashboard/notes",
    label: "Notes",
    icon: <FaClipboardList className="w-4 h-4" />,
  },
];

export default function MenuLateralDashboard() {
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
      localStorage.removeItem("authToken"); // Au cas où
      
      // Rediriger vers la page de login
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même en cas d'erreur, nettoyer et rediriger
      localStorage.clear();
      router.push("/");
    }
  };

  return (
    <aside className="hidden md:flex flex-col gap-4 bg-white/70 backdrop-blur-2xl shadow-2xl w-56 h-screen sticky top-0 z-10 py-0 px-0 border-r border-blue-700">
      <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-800 text-xl tracking-tight drop-shadow">
            EPL
          </span>
          <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs shadow">
            Étudiant
          </span>
        </div>

        <nav className="flex flex-col gap-2 text-sm font-semibold">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  (active
                    ? "bg-gray-100 text-gray-900 font-bold shadow-md "
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 ") +
                  "rounded-xl px-3 py-2.5 transition flex items-center gap-2"
                }
              >
                <span className="text-blue-700">{link.icon}</span>
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
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

        <div className="text-xs text-gray-400 mt-4 text-center select-none">
          &copy; EPL {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}