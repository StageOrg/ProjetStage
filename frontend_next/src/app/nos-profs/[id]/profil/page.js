import React from "react";
import InfosPersonnellesProf from "@/features/nos_profs/infosPersonnelles";


export default async function PageDonneesPersonnellesProf({params}) {
  console.log("Params reçus dans la page profil:", params);
    const { id } = params;
    console.log("ID du professeur depuis la page profil22:", id);
  return <InfosPersonnellesProf profId={id} />;
}