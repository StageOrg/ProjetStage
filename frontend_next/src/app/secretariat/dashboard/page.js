import { redirect } from "next/navigation";

export default function DashboardGestionRedirect() {
  redirect("/secretariat/dashboard/ue-exam");
  return null;
} 