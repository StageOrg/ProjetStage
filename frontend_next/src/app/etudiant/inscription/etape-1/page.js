import React from "react";
import { InscriptionGuard } from "@/components/common/InscriptionGuard"; 
import Etape2InfosPersonnelles from "@/features/etudiant/inscription/etape-1/NouvelEtudiantStep2";

export default function PageStep2() {
  return (
    <InscriptionGuard etape={1}>
      <Etape2InfosPersonnelles />
    </InscriptionGuard>
  );
}

