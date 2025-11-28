"use client";
import React from "react";
import InfosPersonnellesProf from "@/features/nos_profs/infosPersonnelles";


export default function PageDonneesPersonnellesProf({params}) {
    const { id } = React.use(params);
  return <InfosPersonnellesProf profId={id} />;
}