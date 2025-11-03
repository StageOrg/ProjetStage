import { useState, useEffect } from "react";
import PeriodeSaisieService from "@/services/periodeSaisieService";

/**
 * Hook personnalisé pour vérifier s'il existe une période de saisie active.
 * @returns {boolean} true si une période est active aujourd’hui, sinon false.
 */
export default function PeriodeActive() {
  const [periodeActive, setPeriodeActive] = useState(false);

  console.log("Vérification de la période active...");

  useEffect(() => {
    const verifierPeriodeActive = async () => {
      try {
        const periodesTrouves = await PeriodeSaisieService.getAll();
        console.log("Périodes récupérées :", periodesTrouves);

         if (!Array.isArray(periodesTrouves) || periodesTrouves.length === 0) {
          setPeriodeActive(false);
          console.log("Aucune période de saisie trouvée.");
          return;
          }
 
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = periodesTrouves.some((p) => {
          const debut = new Date(p.date_debut);
          const fin = new Date(p.date_fin);
          debut.setHours(0, 0, 0, 0);
          fin.setHours(0, 0, 0, 0);
          return today >= debut && today <= fin;
        });
        console.log("Période de saisie active :", active);

        setPeriodeActive(active);
      } catch (error) {
        console.error("Erreur lors de la récupération des périodes :", error);
        setPeriodeActive(false);
      }
    };

    verifierPeriodeActive();
  }, []);

  return periodeActive;
}
