import MenuLateralProfPublic from "@/components/navigation/MenuLateralProfPublic";
import MenuLateralProfesseur from "../../../components/navigation/MenuLateralProfesseur";
import Header from "../../../components/ui/Header";


export default async function DashboardProfLayout({ children, params }) {
   const resolvedParams = await params;
  const { id } = resolvedParams;
  const profId = id; // Récupérer l'ID du professeur depuis les paramètres de l'URL
  console.log("Layout du professeur avec ID:", profId);
  return (
    <>
    {/* Header en haut */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-700 to-orange-700">
        <Header />
      </header>
      <aside className="hidden md:block fixed top-15 left-0 h-screen z-30">
        <MenuLateralProfPublic profId={profId} />
      </aside>
      <main className="md:ml-64 flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans flex flex-col items-center justify-start px-4 py-12 pt-24 gap-8">
        {children}
      </main>
    </>
  );
} 