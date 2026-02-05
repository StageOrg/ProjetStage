"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import authAPI from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    // Effectuer la déconnexion
      try{
        authAPI.logout();
        setUser(null);
        router.push("/");
        } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
      }
    }, [router]);

  return null;
}
