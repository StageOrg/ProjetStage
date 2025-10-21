import { redirect } from "next/navigation";

export default function DashboardGestionRedirect() {
  redirect("/gestion/dashboard/gestion-ue");
  return null;
} 