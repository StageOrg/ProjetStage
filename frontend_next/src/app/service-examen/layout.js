import MenuLateralServiceExam from "../../components/navigation/MenuLateralServiceExam";
import Header from "../../components/ui/Header";


export default function ServiceExamenLayout({ children }) {
  return (
    <>
      {/* Header en haut */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-teal-700 to-teal-700">
        <Header />
      </header>
      <MenuLateralServiceExam />
      <main className="md:ml-64 flex-1 min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-100 font-sans flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-12 pt-10 gap-8">
        {children}
      </main>
    </>
  );
} 