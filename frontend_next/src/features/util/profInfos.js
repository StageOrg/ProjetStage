"use client";
import { useEffect, useState } from "react";
import profService from "@/services/profService";

export default function ProfInfos({ profId }) {
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profId) return;

    const fetchProf = async () => {
      try {
        const data = await profService.getProfesseurById(profId);
        setProf(data);
      } catch (error) {
        console.error("Erreur récupération prof :", error);
        setProf(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProf();
  }, [profId]);

  if (loading) return <span>Chargement...</span>;

  return <span>{prof?.titre} {" "} {prof?.utilisateur.first_name} {" "} {prof?.utilisateur.last_name.toUpperCase()}</span>;
}
