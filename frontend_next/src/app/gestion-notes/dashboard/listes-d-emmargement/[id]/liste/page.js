
import React from "react";
import  ListeEtudiantsUE from "@/features/resp_notes/dashboard/listes/listeEtudiant";

export default function PageCoursProf({ params }) {
  const { id } = React.use(params);

  return (
    <main className=" w-full ">
      <ListeEtudiantsUE ueId={id} />
    </main>
  );
}
