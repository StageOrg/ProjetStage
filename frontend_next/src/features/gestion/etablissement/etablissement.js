"use client";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react"; 
import DepartementService from "@/services/departementService";
import ParcoursService from "@/services/parcoursService";
import FiliereService from "@/services/filiereService";
import AnneeEtudeService from "@/services/anneeEtudeService";
import SemestreService from "@/services/semestreService";
import AnneeAcademiqueService from "@/services/anneeAcademiqueService";

import DepartementForm from "./formulaires/DepartementForm";
import ParcoursForm from "./formulaires/ParcoursForm";
import FiliereForm from "./formulaires/FiliereForm";
import SemestreForm from "./formulaires/SemestreForm";
import AnneeEtudeForm from "./formulaires/AnneeEtudeForm";
import AnneeAcademiqueForm from "./formulaires/AnneeAcademiqueForm";

// Tu ajouteras AnnéeEtudeForm également

export default function GestionEtablissement({ parcoursOptions, filiereOptions, departementOptions, anneeOptions, semestreOptions }) {
  const [parcours, setParcours] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [anneesAcademiques, setAnneesAcademiques] = useState([]);
  const [activeForm, setActiveForm] = useState(null); // <- POUR OUVRIR LE FORMULAIRE

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDepartements(await DepartementService.getDepartements());
        setParcours(await ParcoursService.getParcours());
        setFilieres(await FiliereService.getFilieres());
        setAnnees(await AnneeEtudeService.getAnneesEtude());
        setSemestres(await SemestreService.getSemestres());
        console.log("semestres loaded:", semestres);
        setAnneesAcademiques(await AnneeAcademiqueService.getAll());
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      }
    };

    fetchData();
  }, []);

  const sections = [
    { id: "departement", title: "Département", items: departements },
    { id: "filiere", title: "Filière", items: filieres },
    { id: "parcours", title: "Parcours", items: parcours },
    { id: "semestre", title: "Semestre", items: semestres },
    { id: "annee", title: "Année d'Étude", items: annees },
    { id: "anneeAcademique", title: "Année Académique", items: anneesAcademiques },
  ];

  const renderForm = () => {
    switch (activeForm) {
      case "departement":
        return <DepartementForm onSubmit={() => setActiveForm(null)} onSuccess={(newDepartement) => setDepartements([...departements, newDepartement])} />;
      case "filiere":
        return <FiliereForm onSubmit={() => setActiveForm(null)} departementOptions={departements} parcoursOptions={parcours}  onSuccess={(newFiliere) => setFilieres([...filieres, newFiliere])}/>;
      case "parcours":
        return <ParcoursForm onSubmit={() => setActiveForm(null)} onSuccess={(newParcours) => setParcours([...parcours, newParcours])} />;
      case "semestre":
        return <SemestreForm onSubmit={() => setActiveForm(null)} onSuccess={(newSemestre) => setSemestres([...semestres, newSemestre])} />;
      case "annee":
        return <AnneeEtudeForm onSubmit={() => setActiveForm(null)} parcoursOptions={parcours} semestreOptions={semestres} onSuccess={(newAnnee) => setAnnees([...annees, newAnnee])} />;
      case "anneeAcademique":
        return <AnneeAcademiqueForm onSubmit={() => setActiveForm(null)} onSuccess={(newAnneeAcademique) => setAnneesAcademiques([...anneesAcademiques, newAnneeAcademique])} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative p-8">
      <h1 className="text-center text-2xl font-bold text-blue-600 mb-8 uppercase">
        Gestion Établissement
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <AcademicCard
            key={section.id}
            section={section}
            onAdd={() => setActiveForm(section.id)}
          />
        ))}
      </div>

      {/* ✅ MODALE DYNAMIQUE */}
      {activeForm && (
        <div className="fixed inset-0 bg-transparent flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => setActiveForm(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
}

function AcademicCard({ section, onAdd }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-lg font-semibold text-gray-800 uppercase cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          {section.title}
        </h2>
        {open && (
          <button
            className="flex items-center gap-0.5 border border-blue-600 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition"
            onClick={onAdd}
          >
            <Plus size={18} /> Ajouter
          </button>
        )}
      </div>

      {open ? (
        <div className="space-y-2">
          {section.items?.length > 0 ? (
            section.items.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition">
                {item?.libelle || item?.nom}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">Aucun élément disponible.</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Cliquez pour voir les éléments</p>
      )}
    </div>
  );
}
