
import React from "react";
import EvaluationUE from "@/features/service-examen/cours/evaluationModUe";


export default async function EvaluationUEPage({ params }) {
   const resolvedParams = await params;
  const { ueId } = resolvedParams;
  console.log("EvaluationUEPage id:", ueId);
  return (
    <main className=" w-full ">
      <EvaluationUE ueId={ueId} />
    </main>
  );
}   