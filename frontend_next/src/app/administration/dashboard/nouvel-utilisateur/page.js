"use client";
import ListeUtilisateurs from "@/features/administration/register/utilisateurs";
export default function NouvelUtilisateur() {
  return (
    <div className="flex-1 p-8 bg-gradient-to-br from-blue-50 via-white to-blue-100 space-y-8">
      
      <ListeUtilisateurs />
    </div>
  );
}