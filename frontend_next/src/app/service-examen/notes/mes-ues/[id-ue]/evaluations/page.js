"use client";

import React from "react";
import EvaluationUE from "@/features/service-examen/cours/evaluationUE";


export default async function EvaluationUEPage({ params }) {
   const resolvedParams = await params;
  const { idUe } = resolvedParams;
  console.log("EvaluationUEPage id:", idUe);
  return (
    <main className=" w-full ">
      <EvaluationUE ueId={idUe} />
    </main>
  );
}
