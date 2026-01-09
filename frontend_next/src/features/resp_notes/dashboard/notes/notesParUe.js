"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfesseurService from "@/services/profService";
import UEService from "@/services/ueService";
import FiliereService from "@/services/filiereService";
import ParcoursService from "@/services/parcoursService";
import AnneeEtudeService from "@/services/anneeEtudeService";
import SemestreService from "@/services/semestreService";
import NotificationService from "@/services/notificationService";
import { useAnneeAcademique } from "@/contexts/AnneeAcademiqueContext";
import { 
  FaClipboardList, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaCheckCircle, 
  FaTimesCircle,
  FaChevronRight,
  FaChevronDown,
  FaBell
} from "react-icons/fa";

export default function Notes() {
  const [filieres, setFilieres] = useState([]);
  const [parcours, setParcours] = useState([]);
  const [anneesEtude, setAnneesEtude] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedParcours, setSelectedParcours] = useState("");
  const [selectedAnneeEtude, setSelectedAnneeEtude] = useState("");
  const [selectedSemestre, setSelectedSemestre] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [infosUE, setInfosUE] = useState({});
  const [selectedUeId, setSelectedUeId] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [openedUE, setOpenedUE] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { annee } = useAnneeAcademique();
  const router = useRouter();

  // Récupération des données
  // Filieres
  useEffect(() => {
    FiliereService.getFilieres()
      .then((data) => setFilieres(data))
      .catch((err) => console.error(err));
  }, []);

  // Parcours
  useEffect(() => {
    ParcoursService.getParcours()
      .then((data) => setParcours(data))
      .catch((err) => console.error(err));
  }, []);

  // Années d'étude
  useEffect(() => {
    AnneeEtudeService.getAnneesEtude()
      .then((data) => setAnneesEtude(data))
      .catch((err) => console.error(err));
  }, []);

  // Semestres
  useEffect(() => {
    SemestreService.getSemestres()
      .then((data) => setSemestres(data))
      .catch((err) => console.error(err));
  }, []);

//Recupération des UEs
  useEffect(() => {
    UEService.getAllUE()
      .then((data) => {
        console.log("Courses data:", data);
        setCourses(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Recupêration des UEs avec controle des notes saisies
  /*   useEffect(() => {
    UEService.controleNotesSaisies(ueId)
      .then((data) => {
        console.log("Courses data:", data);
        setInfosUE(data);
      })
      .catch((err) => console.error(err));
  }, [ueId]);
 */
  const recupererInfosUE = async (ueId) => {
    if(!ueId || !annee) return;
    try {
    const data = await UEService.controleNotesSaisies(ueId, annee.id);

    setInfosUE((prev) => ({
      ...prev,
      [ueId]: data,   // ✅ chaque UE stocke ses propres infos
    }));

  } catch (error) {
    console.error("Erreur lors de la récupération des infos UE :", error);
  }
  };

  // Gestion du tri
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Icônes de tri
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'ascending' 
      ? <FaSortUp className="ml-1 text-blue-600" /> 
      : <FaSortDown className="ml-1 text-blue-600" />;
  };
  // Gestion de l'expansion des lignes
  const toggleRow = (courseId) => {
    setExpandedRows(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // Gestion de la sélection d'une UE
   const handleRowClick = (course) => {
    setSelectedCourse(course.code === selectedCourse?.code ? null : course);
    const SelectedUeId= course.id;
    console.log("SelectedUeId:", SelectedUeId);
    setSelectedUeId(SelectedUeId);
    router.push(`/service-examen/notes/${SelectedUeId}/etudiants-inscrits`);
  };

// Notification au professeur
  const handleNotifyProf = async (libelle_ue, profId, evaluation) => {
      const message = `Rappel : Les notes de ${evaluation.type} pour l'UE ${libelle_ue} n'ont pas encore été saisies.`;
      console.log("message",message, profId);
    try {
      
      await NotificationService.sendNotification({
        userId: profId,
        message: message
      });
      alert(`Notification envoyée 'avec succès au professeur.`);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
      alert("Erreur lors de l'envoi de la notification");
    }
  };
// Fonction utilitaire pour trouver un objet par son ID
  const trouverObjetParId = (array, id) => {
    return array.find(f => f.id === parseInt(id));
  };

  // Filtrage des cours en fonction des critères sélectionnés
  const filteredCourses = courses?.filter((c) => {
    const filiereOk = !selectedFiliere || 
      c.filiere?.some(f => trouverObjetParId(filieres, f)?.abbreviation === selectedFiliere);
    
    const parcoursOk = !selectedParcours || 
      c.parcours?.some(p => trouverObjetParId(parcours, p)?.libelle === selectedParcours);
    
    const semestreOk = !selectedSemestre || 
      trouverObjetParId(semestres, c.semestre)?.libelle === selectedSemestre;
    
    const anneeOk = !selectedAnneeEtude || 
      c.annee_etude?.some(a => trouverObjetParId(anneesEtude, a)?.libelle === selectedAnneeEtude);

    return filiereOk && parcoursOk && semestreOk && anneeOk;
  });
// Tri des cours filtrés
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
    <div className="bg-transparent backdrop-blur-md px-8 py-10 w-full animate-fade-in">
      {/* Titre avec année scolaire */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-blue-900">
          Contrôle des Notes Saisies
        </h1>
      </div>

      {/* Filtres */}
      <div className="flex mb-6 mt-10 gap-4">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-blue-900">
          <FaClipboardList className="text-blue-700" />
          <span>Filtrer par</span>
        </h2>
        <select
          value={selectedFiliere}
          onChange={(e) => setSelectedFiliere(e.target.value)}
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
          onChange={(e) => setSelectedParcours(e.target.value)}
          className="px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Parcours</option>
          {parcours?.map((p, idx) => (
            <option key={idx} value={p.libelle}>
              {p.libelle}
            </option>
          ))}
        </select>

        <select
          value={selectedAnneeEtude}
          onChange={(e) => setSelectedAnneeEtude(e.target.value)}
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
          onChange={(e) => setSelectedSemestre(e.target.value)}
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

      {/* Tableau */}
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
                onClick={() => requestSort('nbre_credit')}
              >
                <div className="flex items-center">
                  Crédit
                  {getSortIcon('nbre_credit')}
                </div>
              </th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50">Parcours</th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50">Filière</th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-center">Année</th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-center">Semestre</th>
              <th className="px-4 py-3 border-b border-gray-200 bg-gray-50 text-center">Détails notes</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course, idx) => (
              <React.Fragment key={idx}>
                <tr 
                className={`hover:bg-gray-50 transition cursor-pointer ${
                  selectedCourse?.code === course.code ? 'bg-orange-50' : ''
                }`}
                onClick={() =>handleRowClick(course)}>
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
                    {trouverObjetParId(parcours, course.parcours)?.libelle}
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
                 
                  <td className="px-4 py-3 border-b border-gray-200 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                          onClick={(e) => {
                            e.stopPropagation();              // ✅ Empêche le clic sur la ligne
                            setOpenedUE(course);              // ✅ On récupère l’UE exacte ici
                            recupererInfosUE(course.id);      // ✅ On charge ses états
                            toggleRow(course.id);             // ✅ On ouvre la ligne
                          }}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          {expandedRows[course.id] ? (
                            <FaChevronDown className="text-lg" />
                          ) : (
                            <FaChevronRight className="text-lg" />
                          )}
                        </button>

                    </div>
                  </td>
                </tr>

                {/* Ligne détaillée */}
                {expandedRows[course.id] && (
                  <tr className="bg-blue-50">
                    <td colSpan="9" className="px-8 py-4 border-b border-gray-200">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800 mb-3">
                          Détails des évaluations :
                        </h4>
                        {infosUE[course.id]?.evaluations?.map((evaluation, evalIdx) => (
                          <div 
                            key={evalIdx} 
                            className="flex items-center justify-between bg-white px-4 py-3 rounded-md shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              {evaluation.etat === "saisi" ? (
                                <FaCheckCircle className="text-green-500 text-lg" />
                              ) : (
                                <FaTimesCircle className="text-red-500 text-lg" />
                              )}
                              <span className={`font-medium ${evaluation.etat === "saisi" ? "text-green-700" : "text-red-700"}`}>
                                Notes de {evaluation.type} : {evaluation.etat === "saisi" ? "Saisies" : "Manquantes"}
                              </span>
                            </div>
                            
                            {evaluation.etat === "manquant" && infosUE[course.id]?.professeur && (
                              <button
                                onClick={() => handleNotifyProf(infosUE[course.id].ue_libelle, infosUE[course.id].professeur.id, evaluation)}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition text-sm"
                              >
                                <FaBell />
                                Notifier {infosUE[course.id].professeur.prenom} {infosUE[course.id].professeur.nom}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}