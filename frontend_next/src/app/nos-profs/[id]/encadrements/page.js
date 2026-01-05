import EncadrementsPublic from "@/features/nos_profs/encadrements";
import React from "react";
export default async function PageEncadrementsPublic({ params }) {
   const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div>
      <EncadrementsPublic profId={id} />
    </div>
  );
}
