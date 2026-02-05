// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import ClientLayoutWrapper from "../components/common/ClientLayoutWrapper";
import { Toaster } from "react-hot-toast";
import { AnneeAcademiqueProvider } from "@/contexts/AnneeAcademiqueContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EPL Connect - École Polytechnique de Lomé",
  description: "Plateforme numérique de l'École Polytechnique de Lomé",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <AuthProvider>
      <AnneeAcademiqueProvider>
      <ClientLayoutWrapper>
        {children}
      <Toaster
        containerStyle={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      </ClientLayoutWrapper>
      </AnneeAcademiqueProvider>
      </AuthProvider>
    </body>
    </html>
  );
}