"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FiliereService from "@/services/filiereService";
import ParcoursService from "@/services/parcoursService";
import AnneeEtudeService from "@/services/anneeEtudeService";
import SemestreService from "@/services/semestreService";
import { FaClipboardList, FaSort, FaSortUp, FaSortDown, FaCheckCircle } from "react-icons/fa";
import UEService from "@/services/ueService";
import ProfService from "@/services/profService";
import ProfesseurService from "@/services/profService";
import EtudiantService from "@/services/etudiantService";

export default function UEs({profId}) {
const [filieres, setFilieres] = useState([]);
const [parcours, setParcours] = useState([]);
const [anneesEtude, setAnneesEtude] = useState([]);
const [semestres, setSemestres] = useState([]);
const [coursesProf, setCoursesProf] = useState([]);
const [coursesEtudiant, setCoursesEtudiant] = useState([]);
const [selectedFiliere, setSelectedFiliere] = useState("");
const [selectedParcours, setSelectedParcours] = useState("");
const [selectedAnneeEtude, setSelectedAnneeEtude] = useState("");
const [selectedSemestre, setSelectedSemestre] = useState("");
const [selectedCourse, setSelectedCourse] = useState(null);
const [selectedFiliereObject, setSelectedFiliereObject] = useState(null);
const [selectedParcoursObject, setSelectedParcoursObject] = useState(null);
const [selectedAnneeEtudeObject, setSelectedAnneeEtudeObject] = useState(null);
const [selectedSemestreObject, setSelectedSemestreObject] = useState(null);
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
const [selectedUeId, setSelectedUeId] = useState(null);
const router = useRouter();
const role = localStorage.getItem("user_role");

//recuperer les filieres
useEffect(() => {
    FiliereService.getFilieres()
      .then((data) => setFilieres(data))
      .catch((err) => console.error(err));
}, []);

//recuperer les parcours
useEffect(() => {
    ParcoursService.getParcours()
      .then((data) => setParcours(data))
      .catch((err) => console.error(err));
}, []);

//recuperer les années d'étude
useEffect(() => {
    AnneeEtudeService.getAnneesEtude()
      .then((data) => setAnneesEtude(data))
      .catch((err) => console.error(err));
}, []);

//recuperer les semestres
useEffect(() => {
    SemestreService.getSemestres()
      .then((data) => setSemestres(data))
      .catch((err) => console.error(err));
}, []);

// récupère les UEs du professeur
useEffect(() => {
    ProfesseurService.getMesUesId(profId)
      .then((data) => {
        setCoursesProf(data);
        console.log("UEs du professeur:", data);
      })
      .catch((err) => console.error(err));
  }, [profId]);

// recuperer les ues de l'étudiant
useEffect(() => {
  if (role !== "etudiant") return;
    const fetchUes = async () => {
      try {
        const ues = await EtudiantService.getMesUes();
        setCoursesEtudiant(ues);
        console.log("UEs de l'étudiant:", ues);
      }
      catch (err) {
        console.error("Erreur récupération UEs de l'étudiant:", err);
      }
    };
    fetchUes();
  }, []);

// Fonction pour vérifier si une UE du prof correspond à une UE de l'étudiant
const isUeCorrespondante = (ueProf) => {
  return coursesEtudiant.some(ueEtudiant => 
    ueEtudiant.id === ueProf.id || ueEtudiant.code === ueProf.code
  );
};

// Gestion du tri
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'ascending' 
      ? <FaSortUp className="ml-1 text-blue-600" /> 
      : <FaSortDown className="ml-1 text-blue-600" />;
  };

  const trouverObjetParId = (array, id) => {
    const objet = array?.find(f => f.id === parseInt(id));
    return objet;
  }

//Filtres
const filteredCourses = coursesProf.filter((c) => {
  const filiereOk =
    !selectedFiliere ||
    trouverObjetParId(filieres, c.filiere)?.abbreviation === selectedFiliere;

  const parcoursOk =
    !selectedParcours ||
    trouverObjetParId(parcours, c.parcours)?.libelle === selectedParcours;

  const semestreOk =
    !selectedSemestre || trouverObjetParId(semestres, c.semestre)?.libelle === selectedSemestre;

  const anneeOk =
    !selectedAnneeEtude || trouverObjetParId(anneesEtude, c.annee_etude)?.libelle === selectedAnneeEtude;

  return filiereOk && parcoursOk && semestreOk && anneeOk;
});

const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  // Gestion de la sélection d'une ligne
  const handleRowClick = (course) => {
    setSelectedCourse(course.code === selectedCourse?.code ? null : course);
    const SelectedUeId = course.id;
    setSelectedUeId(SelectedUeId);
    router.push(`/nos-profs/${profId}/unites-d-enseignement/${SelectedUeId}/infos`);
  };

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in">
      {/* Titre avec année scolaire et bouton + */}
      <div className="flex justify-center items-center mb-2">
        <h1 className="text-2xl font-bold text-blue-900">
          Cours enseignés
        </h1>
      </div>

      {/* Filtre */}
      <div className="flex mb-6 mt-10 gap-4.5">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-blue-900">
          <FaClipboardList className="text-blue-700" />
          <span>Filtrer par</span>
        </h2>
        <select
          value={selectedFiliere}
          onChange={(e) => {
              const filiereObj = filieres.find(f => f.abbreviation === e.target.value);
              setSelectedFiliere(e.target.value);
              setSelectedFiliereObject(filiereObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Filières</option>
          {filieres?.map((filiere, idx) => (
            <option key={idx} value={filiere.abbreviation}>
              {filiere.abbreviation}
            </option>
          ))}
        </select>

         <select
          value={selectedParcours}
          onChange={(e) =>{
            const parcoursObj = parcours.find(p => p.libelle === e.target.value);
            setSelectedParcours(e.target.value)
            setSelectedParcoursObject(parcoursObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value=""> Parcours</option>
          {parcours.map((parcours, idx) => (
            <option key={idx} value={parcours.libelle}>
              {parcours.libelle}
            </option>
          ))}
        </select>

         <select
          value={selectedAnneeEtude}
          onChange={(e) =>{ 
            const anneeObj = anneesEtude.find(a => a.libelle === e.target.value);
            setSelectedAnneeEtude(e.target.value)
            setSelectedAnneeEtudeObject(anneeObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Année d'étude</option>
          {anneesEtude.map((annee, idx) => (
            <option key={idx} value={annee.libelle}>
              {annee.libelle}
            </option>
          ))}
        </select>

         <select
          value={selectedSemestre}
          onChange={(e) => {
            const semestreObj = semestres.find(s => s.libelle === e.target.value);
            setSelectedSemestre(e.target.value)
            setSelectedSemestreObject(semestreObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Semestre</option>
          {semestres.map((semestre, idx) => (
            <option key={idx} value={semestre.libelle}>
              {semestre.libelle}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau professionnel avec tri */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-sm font-medium text-gray-700">
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 w-12">
                <div className="flex items-center justify-center">
                  ✓
                </div>
              </th>
              <th 
                className="px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer"
                onClick={() => requestSort('code')}
              >
                <div className="flex items-center">
                  Code UE
                  {getSortIcon('code')}
                </div>
              </th>
              <th 
                className="px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer"
                onClick={() => requestSort('libelle')}
              >
                <div className="flex items-center">
                  Libellé UE
                  {getSortIcon('libelle')}
                </div>
              </th>
              <th 
                className="px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer"
                onClick={() => requestSort('credits')}
              >
                <div className="flex items-center">
                  Crédit
                  {getSortIcon('credits')}
                </div>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  Parcours
                </div>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  Filière
                </div>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-center">
                <div className="flex items-center justify-center">
                  Année d'étude
                </div>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-center">
                <div className="flex items-center justify-center">
                  Semestre
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gray-50 transition cursor-pointer ${
                  selectedCourse?.code === course.code ? 'bg-orange-50' : ''
                }`}
                onClick={() => handleRowClick(course)}
              >
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {isUeCorrespondante(course) && (
                    <FaCheckCircle className="text-green-500 text-xl mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 border-b border-gray-200 font-medium text-gray-900">
                  {course.code}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                    {course.libelle}
                </td>
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {course.nbre_credit}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {trouverObjetParId(parcours, course.filiere)?.libelle}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {trouverObjetParId(filieres, course.filiere)?.abbreviation}
                </td>
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {trouverObjetParId(anneesEtude, course.annee_etude)?.libelle}
                </td>
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {trouverObjetParId(semestres, course.semestre)?.libelle}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}