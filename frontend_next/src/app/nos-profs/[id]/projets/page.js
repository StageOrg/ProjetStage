import ProjetsPublic from "@/features/nos_profs/projets";
import React from "react";

export default async function PageProjetsPublic({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return (
    <div>
      <ProjetsPublic profId={id} />
    </div>
  );
}
