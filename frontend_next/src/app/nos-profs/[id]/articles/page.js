import ArticlesPublic from "@/features/nos_profs/projets";
import React from "react";

export default async function PageArticlesPublic({ params }) {
  const { id } = params;

  return (
    <div>
      <ArticlesPublic profId={id} />
    </div>
  );
}
