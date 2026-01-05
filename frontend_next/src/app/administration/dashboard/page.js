import { redirect } from "next/navigation";

export default function DashboardAdminRedirect() {
  redirect("/administration/dashboard/journal-d-action");
  return null;
} 