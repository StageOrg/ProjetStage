import MenuLateralProfesseur from "../../../components/navigation/MenuLateralProfesseur";
import Header from "../../../components/ui/Header";


export default function DashboardProfLayout({ children }) {
  return (
    <>
    {/* Header en haut */}
      <header className="fixed top-0 left-0 right-0 z-40  bg-gradient-to-r from-orange-700 to-orange-700">
        <Header />
      </header>
      <MenuLateralProfesseur />
      <main className="md:ml-64 flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-12 pt-24 gap-8">
        {children}
      </main>
    </>
  );
} 