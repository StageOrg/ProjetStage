"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaBook, FaClipboardList, FaProjectDiagram, FaFileAlt, FaChartBar, FaSignOutAlt } from "react-icons/fa";

const links = [
  { href: "/resp_inscription/dashboard/gestionEtudiant", label: "Gestion étudiants", icon: <FaUserGraduate /> },
  { href: "/resp_inscription/dashboard/statistiqueInscription", label: "Statistiques Inscription", icon: <FaChartBar /> },
  { href: "/resp_inscription/dashboard/periodeInscription", label: "Gestion Periode Inscription", icon: <FaBook /> },

];
const handleLogout = () => {
    localStorage.removeItem("authToken"); 
    router.push("/login"); 
  };


export default function MenuLateralAdmin() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col gap-4 bg-white/70 backdrop-blur-2xl shadow-2xl w-64 h-screen sticky top-0 z-10 py-0 px-0  border-r border-blue-900">
      <div className="flex-1 flex flex-col overflow-y-auto py-10 px-6">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-800 text-2xl tracking-tight drop-shadow">EPL</span>
          <span className="bg-teal-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs shadow">Admin</span>
        </div>
        <nav className="flex flex-col gap-2 text-lg font-semibold">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={
                (pathname === link.href
                  ? "bg-teal-100 text-teal-900 font-bold shadow-md "
                  : "text-gray-700 hover:bg-blue-50 hover:text-teal-900 ") +
                "rounded-xl px-4 py-2 transition flex items-center gap-3"
              }
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-25 pt-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 rounded-xl shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            Déconnexion
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-8 text-center select-none">&copy; EPL {new Date().getFullYear()}</div>
      </div>
    </aside>
  );
} 