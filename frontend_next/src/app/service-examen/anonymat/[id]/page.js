"use client";
import React from "react";
import ListeEtudiantsUE from "@/features/service-examen/cours/anonymat/listeEtudiant";

export default function PageSaisieNumAnonyme({ params }) {
  const { id } = React.use(params);
  return <ListeEtudiantsUE ueId={id} />;
}
