"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AnneeAcademiqueContext = createContext();

export function AnneeAcademiqueProvider({ children }) {
  const [anneeChoisie, setAnneeChoisie] = useState(null);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("annee_id");
    if (stored) {
      setAnneeChoisie(Number(stored));
    }
  }, []);

  const changerAnnee = (annee) => {
    setAnneeChoisie(annee.id);
    localStorage.setItem("annee_id", annee.id);
  };

  return (
    <AnneeAcademiqueContext.Provider
      value={{ anneeChoisie, changerAnnee }}
    >
      {children}
    </AnneeAcademiqueContext.Provider>
  );
}

export function useAnneeAcademique() {
  return useContext(AnneeAcademiqueContext);
}
