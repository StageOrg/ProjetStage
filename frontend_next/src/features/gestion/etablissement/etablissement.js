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
import { Trash2 } from "lucide-react";



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
        setAnneesAcademiques(await AnneeAcademiqueService.getAll());
      } catch (error) {
        console.error("Erreur lors du chargement:", error);
      }
    };

    fetchData();
  }, []);

  const sections = [
    { id: "departement", title: "Département", items: departements, nombre: departements.length },
    { id: "filiere", title: "Filière", items: filieres, nombre: filieres.length },
    { id: "parcours", title: "Parcours", items: parcours, nombre: parcours.length },
    { id: "semestre", title: "Semestre", items: semestres, nombre: semestres.length },
    { id: "annee", title: "Année d'Étude", items: annees, nombre: annees.length },
    { id: "anneeAcademique", title: "Année Académique", items: anneesAcademiques, nombre: anneesAcademiques.length },
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

      {/* ✅ MODALE DYNAMIQUE  */}
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


function AcademicCard({ section, onAdd, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const handleDelete = async (sectionId, ItemId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette" + (Item?.libelle || Item?.nom || "") + " ?")) {
      try {
        switch (sectionId) {
          case "departement":
            await DepartementService.deleteDepartement(ItemId);
            setDepartements(prev => prev.filter(c => c.id !== ItemId));
            break;
          case "filiere":
            await FiliereService.deleteFiliere(ItemId);
            setFilieres(prev => prev.filter(c => c.id !== ItemId));
            break;
          case "parcours":
            await ParcoursService.deleteParcours(ItemId);
            setParcours(prev => prev.filter(c => c.id !== ItemId));
            break;
          case "semestre":
            await SemestreService.deleteSemestre(ItemId);
            setSemestres(prev => prev.filter(c => c.id !== ItemId));
            break;
          case "annee":
            await AnneeService.deleteAnnee(ItemId);
            setAnnees(prev => prev.filter(c => c.id !== ItemId));
            break;
          case "anneeAcademique":
            await AnneeAcademiqueService.deleteAnneeAcademique(ItemId);
            setAnneesAcademiques(prev => prev.filter(c => c.id !== ItemId));
            break;
          default:
            alert("Type inconnu pour la suppression");
            return;
        }
        alert("Suppression réussie !");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'élément.");
      }
    }
  };

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
            className="flex items-center gap-1 border border-blue-600 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white transition"
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
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition"
              >
                {/* Texte */}
                <span className="font-medium text-gray-700">
                  {item?.libelle || item?.nom}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-3">
                 {/*  <button
                    onClick={() => onEdit(section.id, item.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Modifier"
                  >
                    <Pencil size={18} />
                  </button> */}

                  <button
                    onClick={() => onDelete(section.id, item.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">Aucun élément disponible.</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          {section.nombre} {section.title}(s) - Cliquez pour visualiser
        </p>
      )}
    </div>
  );
}

