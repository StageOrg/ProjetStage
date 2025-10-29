"use client";
import React, { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import FiliereService from "@/services/filiereService";
import UEService from "@/services/ueService";
import ParcoursService from "@/services/parcoursService";
import AnneeEtudeService from "@/services/anneeEtudeService";
import SemestreService from "@/services/semestreService";
import { FaClipboardList, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

export default function Ues() {
const [filieres, setFilieres] = useState([]);
const [parcours, setParcours] = useState([]);
const [anneesEtude, setAnneesEtude] = useState([]);
const [semestres, setSemestres] = useState([]);
const [courses, setCourses] = useState([]);
const [selectedFiliere, setSelectedFiliere] = useState("");
const [selectedParcours, setSelectedParcours] = useState("");
const [selectedAnneeEtude, setSelectedAnneeEtude] = useState("");
const [selectedSemestre, setSelectedSemestre] = useState("");
const [selectedFiliereObject, setSelectedFiliereObject] = useState(null);
const [selectedParcoursObject, setSelectedParcoursObject] = useState("");
const [selectedAnneeEtudeObject, setSelectedAnneeEtudeObject] = useState("");
const [selectedSemestreObject, setSelectedSemestreObject] = useState("");
const [selectedCourse, setSelectedCourse] = useState(null);
const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
const [selectedUeId, setSelectedUeId] = useState(null);
const router = useRouter();

//recuperer les filieres
useEffect(() => {
    FiliereService.getFilieres()
      .then((data) => setFilieres(data))
      .catch((err) => console.error(err));
      console.log("Filieres data:", filieres);
}, []);

//recuperer les parcours
useEffect(() => {
    ParcoursService.getParcours()
      .then((data) => setParcours(data))
      .catch((err) => console.error(err));
      console.log("Parcours data:", parcours);
}, []);

//recuperer les années d'étude
useEffect(() => {
    AnneeEtudeService.getAnneesEtude()
      .then((data) => setAnneesEtude(data))
      .catch((err) => console.error(err));
      console.log("Annees d'etude data:", anneesEtude);
}, []);
//recuperer les semestres
useEffect(() => {
    SemestreService.getSemestres()
      .then((data) => setSemestres(data))
      .catch((err) => console.error(err));
      console.log("Semestres data:", semestres);
}, []);
// récupère les UEs du prof connecté
useEffect(() => {
   UEService.getAllUE()
      .then((data) => setCourses(data))
      .catch((err) => console.error(err));
      console.log("Courses data:", courses);
  }, []);

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
  const handleRowClick = (course) => {
    setSelectedCourse(course.code === selectedCourse?.code ? null : course);
    const SelectedUeId= course.id;
    console.log("SelectedUeId:", SelectedUeId);
    setSelectedUeId(SelectedUeId);
    router.push(`/gestion-notes/dashboard/evaluations/${SelectedUeId}`);
  };

  const trouverObjetParId = (array,id) => {
    const objet = array.find(f => f.id === parseInt(id));
    return objet;
  }
//Filtres
const filteredCourses = courses?.filter((c) => {
  const filiereOk =
    !selectedFiliere ||
    trouverObjetParId(filieres, c.filiere)?.abbreviation === selectedFiliere;

  const parcoursOk =
    !selectedParcours ||
    trouverObjetParId(parcours, c.parcours)?.libelle === selectedParcours;
    console.log("ParcoursOk:", parcoursOk);

  const semestreOk =
    !selectedSemestre || trouverObjetParId(semestres, c.semestre)?.libelle === selectedSemestre;

  const anneeOk =
    !selectedAnneeEtude || trouverObjetParId(anneesEtude, c.annee_etude)?.libelle === selectedAnneeEtude;

  return filiereOk && parcoursOk && semestreOk && anneeOk;
});


const sortedCourses = [...(filteredCourses || [])].sort((a, b) => {
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

  return (
    <div className="bg-transparent  backdrop-blur-md   px-8 py-10 w-full  animate-fade-in">
      {/* Titre avec année scolaire */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-blue-900">
          Cours enseignés
        </h1>
        <div className="text-sm font-medium text-gray-600">
          2023-2024 | Semestre 1
        </div>
      </div>

      {/* Filtre */}
      <div className="flex  mb-6 mt-10 gap-4.5">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-blue-900">
          <FaClipboardList className="text-blue-700" />
          <span>Filtrer par</span>
        </h2>
        <select
          value={selectedFiliere}
          onChange={(e) => {
              const filiereObj = filieres.find(f => f.abbreviation === e.target.value);
              setSelectedFiliere(e.target.value);
              console.log("Valeur sélectionnée:", e.target.value); 
              setSelectedFiliereObject(filiereObj);
              console.log("Filiere choisie:", filiereObj);
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
             console.log("Parcours choisi:", parcoursObj); 
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value=""> Parcours</option>
          {parcours?.map((parcours, idx) => (
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
            console.log("Année d'étude choisie:", anneeObj);
          } }
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Année d'étude</option>
          {anneesEtude?.map((annee, idx) => (
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
            console.log("Semestre choisi:", semestreObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Semestre</option>
          {semestres?.map((semestre, idx) => (
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
                onClick={() =>handleRowClick(course)}
              >
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
                  {trouverObjetParId(parcours,course.filiere)?.libelle }
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {trouverObjetParId(filieres,course.filiere)?.abbreviation }
                </td>
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {trouverObjetParId(anneesEtude,course.annee_etude)?.libelle }
                </td>
                <td className="px-4 py-3 border-b border-gray-200 text-center">
                  {trouverObjetParId(semestres,course.semestre)?.libelle }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}