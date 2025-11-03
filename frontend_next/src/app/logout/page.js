"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import authAPI from "@/services/authService";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Effectuer la déconnexion
      try{
        authAPI.logout();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("user_role");
        localStorage.removeItem("annee_id");
        localStorage.setItem("user_role", "visiteur")
        console.log("item removed");
        router.push("/");
        } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
      }
    }, [router]);

  return null;
}
