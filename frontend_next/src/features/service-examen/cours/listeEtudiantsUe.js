import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.default ? pdfFonts.default.vfs : pdfFonts.vfs;
import NoteService from "@/services/noteService";
import EtudiantService from "@/services/etudiantService";

function ListeEtudiantsUE({ ueId }) {
  const [etudiants, setEtudiants] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editIndex, setEditIndex] = useState(null);
  const [editedData, setEditedData] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!ueId) return;
      try {
        const res = await EtudiantService.getNotesByUE(ueId);
        setEtudiants(res.etudiants);
        setEvaluations(res.evaluations);
        if (res.evaluations.length === 0) {
          router.push(`/service-examen/notes/mes-ues/${ueId}/evaluations`);
        }
      } catch (err) {
        console.error("Erreur récupération notes :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ueId]);

  const handleEdit = (index, etu) => {
    setEditIndex(index);
    setEditedData({ note: etu.notes[selectedEvaluation.id] ?? "" });
  };

  const handleSave = async (index, etu) => {
    if (!selectedEvaluation) return;
    const noteValue = parseFloat(editedData.note);
    if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
      alert("Veuillez entrer une note valide entre 0 et 20.");
      return;
    }

    try {
      await NoteService.createNote(etu.id, selectedEvaluation.id, noteValue);
      setEtudiants((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, notes: { ...e.notes, [selectedEvaluation.id]: noteValue } }
            : e
        )
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
    }
  };
//  Numero anonyme
  const handleChangeNumeroAnonyme = (index, value) => {
   const updated = [...etudiants];
    updated[index].num_anonyme = value;
    setEtudiants(updated);
  };


  //   Calcul moyenne pondérée
  const calculerMoyenne = (etu) => {
    let somme = 0;
    let totalPoids = 0;
    for (const evalObj of evaluations) {
      const note = etu.notes[evalObj.id];
      if (note === undefined || note === null) return "-";
      somme += note * evalObj.poids;
      totalPoids += evalObj.poids;
    }
    return totalPoids > 0 ? (somme / totalPoids).toFixed(2) : "-";
  };

  //   Export Excel
  const exportExcel = () => {
    const data = etudiants.map((etu) => {
      const row = {
        "N° Carte": etu.num_carte,
        Nom: etu.nom,
        Prénom: etu.prenom,
        Sexe: etu.sexe,
      };
      evaluations.forEach((ev) => {
        row[`${ev.type} (${ev.poids}%)`] = etu.notes[ev.id] ?? "-";
      });
      row["Moyenne"] = calculerMoyenne(etu);
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "notes.xlsx");
  };

  //   Export PDF
  const exportPDF = () => {
    const body = [
      ["N° Carte", "Nom", "Prénom", "Sexe", ...evaluations.map((ev) => `${ev.type} (${ev.poids}%)`), "Moyenne"]
    ];

    etudiants.forEach((etu) => {
      const row = [
        etu.num_carte,
        etu.nom,
        etu.prenom,
        etu.sexe,
        ...evaluations.map((ev) => etu.notes[ev.id] ?? "-"),
        calculerMoyenne(etu)
      ];
      body.push(row);
    });

    const docDefinition = {
      content: [
        { text: "Liste des étudiants et notes", style: "header" },
        { table: { headerRows: 1, body }, layout: "lightHorizontalLines" },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
      },
    };

    pdfMake.createPdf(docDefinition).download("notes.pdf");
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="bg-transparent px-8 py-10 w-full h-full animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl">Étudiants inscrits</h2>
        <div className="flex gap-3">
          <button onClick={exportPDF} className="p-2 bg-red-500 text-white rounded-lg flex items-center gap-2">
            <FileDown size={18} /> PDF
          </button>
          <button onClick={exportExcel} className="p-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>
      {/* Sélecteur d'évaluation */}
      <div className="mb-4">
        <label className="mr-2 font-bold">Type d'évaluation :</label>
        <select
          value={selectedEvaluation?.id || ""}
          onChange={(e) => {
            const evalChoisi = evaluations.find(
              (ev) => ev.id === parseInt(e.target.value)
            );
            setSelectedEvaluation(evalChoisi);
            setEditIndex(null);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>
            -- Choisir --
          </option>
          {evaluations.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.type} ({ev.poids}%)
            </option>
          ))}
        </select>
        <div> <button onClick={() => router.push(`/service-examen/notes/${ueId}/evaluations`)
         }> Modifier Evaluation </button> </div>
      </div>
      
      {/* Tableau */}
      <table className="w-full border-collapse border">
  <thead>
    <tr className="bg-gray-100">
      {/* 🔹 Cas normal */}
      {selectedEvaluation?.type !== "Examen" ? (
        <>
          <th className="border px-2 py-1">N° Carte</th>
          <th className="border px-2 py-1">Nom</th>
          <th className="border px-2 py-1">Prénom</th>
          <th className="border px-2 py-1">Sexe</th>
        </>
      ) : (
        /* 🔹 Cas examen anticipé */
        <>
          <th className="border px-2 py-1">Nom</th>
          <th className="border px-2 py-1">Prénom</th>
          <th className="border px-2 py-1">N° Anonyme</th>
        </>
      )}

      {/*  Colonne de l’évaluation sélectionnée */}
      {selectedEvaluation && (
        <th className="border px-2 py-1 text-center">
          {selectedEvaluation.type} ({selectedEvaluation.poids}%)
        </th>
      )}

      {/*  Colonne moyenne */}
      <th className="border px-2 py-1 text-center">Moyenne</th>
    </tr>
  </thead>

  <tbody>
    {etudiants.map((etu, index) => (
      <tr key={etu.id} className="even:bg-gray-50">
        {/* 🔹 Cas normal */}
        {selectedEvaluation?.type !== "Examen" ? (
          <>
            <td className="border px-2 py-1 text-center">{etu.num_carte}</td>
            <td className="border px-2 py-1">{etu.nom}</td>
            <td className="border px-2 py-1">{etu.prenom}</td>
            <td className="border px-2 py-1 text-center">{etu.sexe}</td>
          </>
        ) : (
          /* Cas examen anticipé → saisie du numéro anonyme */
          <>
            <td className="border px-2 py-1 text-center">{etu.nom}</td>
            <td className="border px-2 py-1 text-center">{etu.prenom}</td>
            <td className="border px-2 py-1 text-center">
              <input
                type="text"
                value={etu.num_anonyme || ""}
                onChange={(e) => handleChangeNumeroAnonyme(index, e.target.value)}
              className="w-24 text-center border rounded"
            />
          </td>
          </>
        )}

        {/*  Colonne note (éditable comme avant) */}
        {selectedEvaluation && (
          <td className="border px-2 py-1 text-center cursor-pointer">
            {editIndex === index ? (
              <input
                type="number"
                min="0"
                max="20"
                value={editedData.note}
                onChange={(e) => setEditedData({ note: e.target.value })}
                onBlur={() => handleSave(index, etu)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave(index, etu);
                }}
                autoFocus
                className="w-16 text-center border rounded"
              />
            ) : (
              <span onClick={() => handleEdit(index, etu)}>
                {etu.notes[selectedEvaluation.id] ?? "-"}
              </span>
            )}
          </td>
        )}

        {/*   Colonne moyenne */}
        <td className="border px-2 py-1 text-center font-bold">
          {calculerMoyenne(etu)}
        </td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
}

export default ListeEtudiantsUE;
