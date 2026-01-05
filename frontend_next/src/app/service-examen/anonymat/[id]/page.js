"use client";
import React from "react";
import ListeEtudiantsUE from "@/features/service-examen/cours/anonymat/listeEtudiant";

export default async function PageSaisieNumAnonyme({ params }) {
    const resolvedParams = await params;
  const { id } = resolvedParams;
  return <ListeEtudiantsUE ueId={id} />;
}
