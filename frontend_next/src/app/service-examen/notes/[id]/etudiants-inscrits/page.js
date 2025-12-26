
import React from "react";
import ListeEtudiantsUE from "@/features/service-examen/cours/listeEtudiantsUe";

export default async function PageEtudiantUe({ params }) {
    const resolvedParams = await params;
  const { id } = resolvedParams;
  console.log("SelectedUeId paa:", id);
  return (
    <main className=" w-full ">
      <ListeEtudiantsUE ueId ={id} />
    </main>
  );
}
