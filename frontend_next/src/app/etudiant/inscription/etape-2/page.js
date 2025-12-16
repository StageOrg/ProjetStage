"use client";
import { useRouter } from "next/navigation";
import { InscriptionGuard } from "@/components/common/InscriptionGuard"; 
import Etape3InfosPedagogiques from "@/features/etudiant/inscription/etape-3/NouvelEtudiantStep3";

export default function PageStep3() {
  const router = useRouter();
  
  // Logique métier conservée
  const handleSubmit = (data) => {
    console.log("Données reçues :", data);
    router.push("/etudiant/inscription/etape-4");
  };
  
  return (
    <InscriptionGuard etape={2}>
      <main className="p-6">
        <Etape3InfosPedagogiques onSubmit={handleSubmit} />
      </main>
    </InscriptionGuard>
  );
}

