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
      <aside className="hidden md:block fixed top-15 left-0 h-screen z-30">
        <MenuLateralDashboard />
      </aside>

      {/* Contenu principal */}
      <main className="md:ml-64 pt-20 min-h-screen bg-gtransparent font-sans flex flex-col items-center justify-center px-4 py-12 gap-8">
        {children}
      </main>
    </>
  );
}
