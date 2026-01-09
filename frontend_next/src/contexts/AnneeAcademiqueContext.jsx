"use client";
import { createContext, useContext, useEffect, useState } from "react";

const AnneeAcademiqueContext = createContext();

export function AnneeAcademiqueProvider({ children }) {
  const [annee, setAnnee] = useState(null);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("annee_id");
    if (stored) {
      setAnnee(Number(stored));
    }
  }, []);

  // Synchroniser avec localStorage quand annee change
  useEffect(() => {
    if (annee !== null) {
      localStorage.setItem("annee_id", annee);
    }
  }, [annee]);

  return (
    <AnneeAcademiqueContext.Provider value={{ annee, setAnnee }}>
      {children}
    </AnneeAcademiqueContext.Provider>
  );
}

export function useAnneeAcademique() {
  const context = useContext(AnneeAcademiqueContext);
  if (context === undefined) {
    throw new Error('useAnneeAcademique doit être utilisé dans AnneeAcademiqueProvider');
  }
  return context;
}