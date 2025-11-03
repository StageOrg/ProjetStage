"use client";

import React from "react";
import EvaluationUE from "@/features/service-examen/cours/evaluationUE";


export default function EvaluationUEPage({ params }) {
  const { "id-ue": idUe} = React.use(params);
  console.log("EvaluationUEPage id:", idUe);
  return (
    <main className=" w-full ">
      <EvaluationUE ueId={idUe} />
    </main>
  );
}
