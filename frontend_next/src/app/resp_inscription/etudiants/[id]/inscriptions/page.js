// src/app/resp_inscription/etudiants/[ui]/inscriptions/page.js
"use client";
import InscriptionsEtudiant from "@/features/res_inscrip/etudiants/[id]/inscriptions/inscriptionsNombre";

export default function DetailsPage() {
  return (
    <main className="p-6">
      <InscriptionsEtudiant />  
    </main>
  );
}