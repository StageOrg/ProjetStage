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
        localStorage.removeItem("user_role");
        router.push("/");
        } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
        }
    }, [router]);

  return null;
}
