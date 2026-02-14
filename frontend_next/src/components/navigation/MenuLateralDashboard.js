"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaSignOutAlt, FaUser, FaChartBar, FaClipboardList } from "react-icons/fa";
import { authAPI } from "@/services/authService";
import { useState } from "react";
import MobileMenuToggle from "@/components/ui/MobileMenuToggle";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      // Appeler la méthode logout de authAPI
      await authAPI.logout(false); 
      
     
      
      // Rediriger vers la page de login
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Même en cas d'erreur, nettoyer et rediriger
      router.push("/");
    }
  };

  return (
    <>
      <MobileMenuToggle 
        isOpen={isMobileMenuOpen} 
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
      />
      <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky flex flex-col gap-4 bg-white/70 backdrop-blur-2xl shadow-2xl w-56 h-screen top-0 z-40 py-0 px-0 border-r border-blue-700 transition-transform duration-300`}>
      <div className="flex-1 flex flex-col overflow-y-auto py-8 px-4">
        <div className="mb-6 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-800 text-xl tracking-tight drop-shadow">
            EPL
          </span>
          <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs shadow">
            Étudiant
          </span>
        </div>

        <nav className="flex flex-col gap-1 text-base font-medium pt-5">
          {links.map(link => (
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
              <span className="text-lg flex-shrink-0 text-blue-700">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className=" pt-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:from-red-900 hover:to-red-900 text-white font-semibold py-2.5 rounded-xl shadow-lg transition-all duration-200"
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
    {isMobileMenuOpen && (
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-30"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )}
    </>
  );
}