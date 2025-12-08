import { redirect } from "next/navigation";

export default async  function DashboardProfRedirect({ params }) {
  console.log("Params reçus dans le redirect:", params);
  const { id } = params;
  console.log("ID du professeur pour le redirect:", id);
  redirect(`/nos-profs/${id}/profil`);
} 
