"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Formulaire from "@/components/ui/Formulaire.js";
import Link from "next/link";
import { authAPI } from '@/services/authService';

export default function Connexion() {
  const router = useRouter();

  const champs = [
    {
      nom: "identifiant",
      label: "Identifiant",
      placeholder: "username",
      requis: true,
    },
    {
      nom: "motdepasse",
      label: "Mot de passe",
      type: "password",
      placeholder: "password",
      requis: true,
    },
  ];

  
  async function handleFormSubmit(valeurs) {
    console.log("Token:", localStorage.getItem('access_token'))
    console.log("Form values:", valeurs);
    try {
      const data = await authAPI.login(valeurs.identifiant, valeurs.motdepasse);

      // Sauvegarde du token dans localStorage
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("user_role", data.user.role);
      console.log("Connexion réussie", data.user);
      // Redirection après connexion
      if (data.user.role === "professeur") {
      router.push("/enseignant/dashboard");
    } else if (data.user.role === "etudiant") {
      router.push("/etudiant/dashboard");
    } else if (data.user.role === "admin") {
      router.push("/administration/dashboard");
    } 
    else if (data.user.role === "resp_notes") {
      router.push("/gestion-notes/dashboard");
    } 
    else if (data.user.role === "resp_inscription") {
      router.push("/resp_inscription/dashboard");  
    }else if (data.user.role === "gestionnaire") {
      router.push("/gestion/dashboard");
    } 
    else if (data.user.role === "secretaire") {
      router.push("/secretariat/dashboard/ue-exam");
    } else {
      router.push("/programmes"); // fallback
    }
      } catch (error) {
        console.error("Erreur de connexion", error);
       // alert("Identifiants incorrects");
    }

  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-12">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-6 text-center">Connexion </h1>

        <Formulaire champs={champs} onSubmit={handleFormSubmit} />

        <div className="mt-6 text-center flex flex-col gap-2">
          <Link href="/" className="text-blue-700 hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}