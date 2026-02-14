import MenuLateralDashboard from "../../../components/navigation/MenuLateralDashboard";
import HeaderConnexion from "../../../components/ui/HeaderConnexion";

export default function DashboardLayout({ children }) {
  return (
    <>
      {/* Header en haut */}
      <header className="fixed top-0 left-0 right-0 z-40  bg-gradient-to-r from-blue-600 to-blue-600">
        <HeaderConnexion/>
      </header>

      {/* Menu latéral */}
      <MenuLateralDashboard />

      {/* Contenu principal */}
      <main className="md:ml-56 pt-20 min-h-screen bg-gtransparent font-sans flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 gap-8">
        {children}
      </main>
    </>
  );
}
