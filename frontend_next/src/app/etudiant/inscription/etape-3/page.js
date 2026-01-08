import { useRouter } from "next/navigation";
import { InscriptionGuard } from "@/components/common/InscriptionGuard";
import Etape4SelectionUE from "@/features/etudiant/inscription/etape-4/NouvelEtudiantStep4";

export default function PageStep4() {
  const router = useRouter();
  
  // Si tu as une logique de soumission finale
  const handleSubmit = (data) => {
    console.log("Inscription finalisée :", data);
    // Redirection après inscription réussie
    router.push("/etudiant/dashboard/donnees-personnelles");
  };
  
  return (
    <InscriptionGuard etape={3}>
      <main className="">
        <Etape4SelectionUE onSubmit={handleSubmit} />
      </main>
    </InscriptionGuard>
  );
}
