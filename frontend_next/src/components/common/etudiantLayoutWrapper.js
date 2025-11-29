"use client";
import Header from "../ui/Header";
import { usePathname } from "next/navigation";

export default function EtudiantLayoutWrapper({ children }) {
  const pathname = usePathname();

  // Afficher le headerConnexion on est dans /etudiant/dashboard
  //const showHeader =(pathname.startsWith("/etudiant/dashboard") ); 
  const showHeader = true;
 
  return (
    <>
      {showHeader && <Header />}
      <div className={showHeader ? "pt-2" : ""}>{children}</div>
        
    </>
    
  );
   

}
