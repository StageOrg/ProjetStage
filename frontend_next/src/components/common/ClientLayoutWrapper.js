"use client";
import Header from "../ui/Header";
import { usePathname } from "next/navigation";

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname();
  const showHeader = !(
    pathname.startsWith("/etudiant")
    /* pathname.startsWith("/enseignant") ||
    pathname.startsWith("/administration") */
  );
 // const showHeader = true;
  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

