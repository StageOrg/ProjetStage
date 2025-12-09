import ArticlesPublic from "@/features/nos_profs/articles";
import React from "react";

export default async function PageArticlesPublic({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return (
    <div>
      <ArticlesPublic profId={id} />
    </div>
  );
}
