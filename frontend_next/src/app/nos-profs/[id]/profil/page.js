import React from "react";
import InfosPersonnellesProf from "@/features/nos_profs/infosPersonnelles";

export default async function PageDonneesPersonnellesProf({ params }) {
 const resolvedParams = await params;
  const { id } = resolvedParams;
  console.log("ID du professeur depuis la page profil:", id);
  
  return <InfosPersonnellesProf profId={id} />;
}