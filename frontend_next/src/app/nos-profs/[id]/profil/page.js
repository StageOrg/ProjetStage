import React from "react";
import InfosPersonnellesProf from "@/features/nos_profs/infosPersonnelles";

export default function PageDonneesPersonnellesProf({ params }) {
  const { id } = params;
  console.log("ID du professeur depuis la page profil:", id);
  
  return <InfosPersonnellesProf profId={id} />;
}