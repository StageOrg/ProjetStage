import ProjetsPublic from "@/features/nos_profs/projets";
import React from "react";

export default async function PageProjetsPublic({ params }) {
  const { id } = params;

  return (
    <div>
      <ProjetsPublic profId={id} />
    </div>
  );
}
