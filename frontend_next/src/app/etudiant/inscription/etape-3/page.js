"use client";

import { useRouter } from "next/navigation"; 
import Etape3InfosPedagogiques from "@/features/etudiant/inscription/etape-3/NouvelEtudiantStep3";

export default function PageStep3() {
  const router = useRouter();

  // data = { parcours, filiere, annee } envoyé par l'enfant
  const handleSubmit = (data) => {
    console.log("Données reçues :", data);
    router.push("/etudiant/inscription/etape-4");
  };

  return (
    <main className="p-6">
      <Etape3InfosPedagogiques onSubmit={handleSubmit} />
    </main>
  );
}
