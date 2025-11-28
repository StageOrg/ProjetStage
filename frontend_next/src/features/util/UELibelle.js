import { useEffect, useState } from "react";
import ueService from "@/services/ueService";

export default function UELibelle({ ueId }) {
  const [libelle, setLibelle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ueId) return;

    const fetchUE = async () => {
      try {
        const data = await ueService.getUEById(ueId);
        setLibelle(data.libelle || "UE introuvable");
      } catch (error) {
        console.error("Erreur récupération UE :", error);
        setLibelle("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchUE();
  }, [ueId]);

  if (loading) return <span>Chargement...</span>;

  return <span>{libelle}</span>;
}
