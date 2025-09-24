"use client";
import React, { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import FiliereService from "@/services/filiereService";
import ParcoursService from "@/services/parcoursService";
import AnneeEtudeService from "@/services/anneeEtudeService";
import SemestreService from "@/services/semestreService";
import { FaClipboardList, FaSort, FaSortUp, FaSortDown, FaPlus, FaTimes } from "react-icons/fa";
import UEService from "@/services/ueService";

export default function GestionUEs() {
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

// États pour le formulaire
const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
  libelle: '',
  code: '',
  nbre_credit: '',
  composite: false,
  parcours: [],
  filiere: [],
  annee_etude: [],
  semestre: ''
});
const [isSubmitting, setIsSubmitting] = useState(false);

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
// récupère les UEs 
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
  const trouverObjetParId = (array,id) => {
    const objet = array.find(f => f.id === parseInt(id));
    return objet;
  }

  // Fonction pour gérer les sélections multiples
  const handleMultiSelect = (field, value, isSelected) => {
    setFormData(prev => ({
      ...prev,
      [field]: isSelected 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
            console.log("Données UE envoyées au backend:", formData);

      const newUE = await UEService.creerUE(
        formData.libelle,
        formData.code,
        parseInt(formData.nbre_credit),
        formData.composite,
        formData.parcours,
        formData.filiere,
        formData.annee_etude,
        formData.semestre
      );
      
      // Ajouter la nouvelle UE à la liste
      setCourses(prev => [...prev, newUE]);
      
      // Réinitialiser le formulaire
      setFormData({
        libelle: '',
        code: '',
        nbre_credit: '',
        composite: false,
        parcours: [],
        filiere: [],
        annee_etude: [],
        semestre: ''
      });
      
      setShowForm(false);
      console.log("UE créée avec succès:", newUE);
    } catch (error) {
      console.error("Erreur lors de la création de l'UE:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

//Filtres
const filteredCourses = courses.filter((c) => {
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

  return (
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in">
      {/* Titre avec année scolaire et bouton + */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-blue-900">
          Cours enseignés
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-gray-600">
            2023-2024 | Semestre 1
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Ajouter UE
          </button>
        </div>
      </div>

      {/* Modal du formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Ajouter une UE</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Libelle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libelle:
                </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData(prev => ({...prev, libelle: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code:
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Nombre de crédits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nbre credit:
                </label>
                <input
                  type="number"
                  value={formData.nbre_credit}
                  onChange={(e) => setFormData(prev => ({...prev, nbre_credit: e.target.value}))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Composite */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="composite"
                  checked={formData.composite}
                  onChange={(e) => setFormData(prev => ({...prev, composite: e.target.checked}))}
                  className="mr-2"
                />
                <label htmlFor="composite" className="text-sm font-medium text-gray-700">
                  Composite
                </label>
              </div>

              {/* Parcours (sélection multiple) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parcours:
                </label>
                <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                  {parcours.map((p) => (
                    <div key={p.id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`parcours-${p.id}`}
                        checked={formData.parcours.includes(p.id)}
                        onChange={(e) => handleMultiSelect('parcours', p.id, formData.parcours.includes(p.id))}
                        className="mr-2"
                      />
                      <label htmlFor={`parcours-${p.id}`} className="text-sm">
                        {p.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filière (sélection multiple) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filiere:
                </label>
                <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                  {filieres.map((f) => (
                    <div key={f.id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`filiere-${f.id}`}
                        checked={formData.filiere.includes(f.id)}
                        onChange={(e) => handleMultiSelect('filiere', f.id, formData.filiere.includes(f.id))}
                        className="mr-2"
                      />
                      <label htmlFor={`filiere-${f.id}`} className="text-sm">
                        {f.abbreviation} - {f.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Année d'étude (sélection multiple) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annee etude:
                </label>
                <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                  {anneesEtude.map((a) => (
                    <div key={a.id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`annee-${a.id}`}
                        checked={formData.annee_etude.includes(a.id)}
                        onChange={(e) => handleMultiSelect('annee_etude', a.id, formData.annee_etude.includes(a.id))}
                        className="mr-2"
                      />
                      <label htmlFor={`annee-${a.id}`} className="text-sm">
                        {a.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semestre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semestre:
                </label>
                <select
                  value={formData.semestre}
                  onChange={(e) => setFormData(prev => ({...prev, semestre: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionnez un semestre</option>
                  {semestres.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.libelle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Validation...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              console.log("Valeur sélectionnée:", e.target.value); 
              setSelectedFiliereObject(filiereObj);
              console.log("Filiere choisie:", filiereObj);
          }}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Filières</option>
          {filieres.map((filiere, idx) => (
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
            console.log("Année d'étude choisie:", anneeObj);
          } }
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
            console.log("Semestre choisi:", semestreObj);
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