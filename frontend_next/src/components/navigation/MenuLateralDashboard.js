"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/etudiant/dashboard/donnees-personnelles",
    label: "Données personnelles",
    icon: (
      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    ),
  },
  {
    href: "/etudiant/dashboard/statistiques",
    label: "Statistique personnelle",
    icon: (
      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 17a2.5 2.5 0 005 0V7a2.5 2.5 0 00-5 0v10zm-6 0a2.5 2.5 0 005 0V7a2.5 2.5 0 00-5 0v10z" /></svg>
    ),
  },
  
  {
    href: "/etudiant/dashboard/notes",
    label: "Notes",
    icon: (
      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 018 0v2m-4-4a4 4 0 100-8 4 4 0 000 8z" /></svg>
    ),
  },
];
const handleLogout = () => {
    localStorage.removeItem("authToken"); 
    router.push("/login"); 
  };
export default function MenuLateralDashboard() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col gap-4 bg-white/70 backdrop-blur-2xl shadow-2xl w-64 h-screen sticky top-0 z-10 py-0 px-0  border-r border-blue-700">
      <div className="flex-1 flex flex-col overflow-y-auto py-10 px-6">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <span className="font-extrabold text-blue-800 text-2xl tracking-tight drop-shadow">EPL</span>
          <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg text-xs shadow">Étudiant</span>
        </div>
        <nav className="flex flex-col gap-2 text-lg font-semibold">
          {links.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  (active
                    ? "bg-gray-100 text-gray-900 font-bold shadow-md "
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 ") +
                  "rounded-xl px-4 py-2 transition flex items-center gap-3"
                }
              >
                <span className="text-xl">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-12 pt-8">
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
