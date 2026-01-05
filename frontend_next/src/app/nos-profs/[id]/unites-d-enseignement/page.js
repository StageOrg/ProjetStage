import UEs from "@/features/nos_profs/cours";
import React from "react";
export default async function PageUEsPublic({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return (
    <div>
      <UEs profId={id} />
    </div>
  );
}
