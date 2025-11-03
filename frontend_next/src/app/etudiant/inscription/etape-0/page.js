"use client";

import { useRouter } from "next/navigation"; 
import React from "react";
import EtudiantStep0 from "@/features/etudiant/inscription/etape-0/EtudiantStep0";
export default function PageStep0() {
  const router = useRouter();   
  return (
    <EtudiantStep0/>
  );
}