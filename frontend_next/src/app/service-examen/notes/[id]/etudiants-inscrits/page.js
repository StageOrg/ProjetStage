"use client";

import React from "react";
import ListeEtudiantsUE from "@/features/service-examen/cours/listeEtudiantsUe";

export default  function PageEtudiantUe({ params }) {
  const { id } = React.use(params);
  console.log("SelectedUeId paa:", id);
  return (
    <main className=" w-full ">
      <ListeEtudiantsUE ueId ={id} />
    </main>
  );
}
