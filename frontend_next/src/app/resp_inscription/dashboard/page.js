import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardResInsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role");

    if (!accessToken) {
      router.push("/login?next=/resp_inscription/gestionEtudiant");
    } else if (userRole !== "resp_inscription") {
      router.push("/login?error=role_invalide&next=/resp_inscription/gestionEtudiant");
    } else {
      router.push("/resp_inscription/dashboard/gestionEtudiant");
    }
  }, [router]);

  return null; 
}