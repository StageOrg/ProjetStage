
// components/ExportButtons.js
"use client";
import { FileDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.default ? pdfFonts.default.vfs : pdfFonts.vfs;

export default function Export({ etudiants, evaluations, evaluation, calculerMoyenne, type, annee, semestre }) {
  console.log("evaluation", evaluation);
  // --- Export Excel ---
  const exportExcel = () => {
    const data = etudiants.map((etu) => {
      const anneeCourte = annee ? annee.slice(0, 4) : "";
      const semestreCourt = semestre.charAt(0).toUpperCase(); // par défaut, première lettre

      const row = type === "examen"
        ? { Annee: anneeCourte,
            Semestre: semestreCourt,
            Anonymat: etu.num_anonymat,
            Carte : etu.num_carte,
            Etudiant: etu.nom + " " + etu.prenom,
         }
        : {
            Annee: anneeCourte,
            Semestre: semestreCourt,
            Carte : etu.num_carte,
            Etudiant: etu.nom + " " + etu.prenom,
          };

        row["Note"] = etu.notes?.[evaluation.id] ?? "-";

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "notes.xlsx");
  };

  // --- Export PDF ---
  const exportPDF = () => {
    const headers =
      type === "examen"
        ? ["N° Anonyme", ...evaluations.map((ev) => `${ev.type} (${ev.poids}%)`), "Moyenne"]
        : ["N° Carte", "Nom", "Prénom", "Sexe", ...evaluations.map((ev) => `${ev.type} (${ev.poids}%)`), "Moyenne"];

    const body = [headers];

    etudiants.forEach((etu) => {
      const row =
        type === "examen"
          ? [etu.num_anonyme, ...evaluations.map((ev) => etu.notes?.[ev.id] ?? "-"), calculerMoyenne(etu)]
          : [
              etu.num_carte,
              etu.nom,
              etu.prenom,
              etu.sexe,
              ...evaluations.map((ev) => etu.notes?.[ev.id] ?? "-"),
              calculerMoyenne(etu),
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

  return (
    <div className="flex gap-3 mt-3 mb-7">
      <button
        onClick={exportPDF}
        className="p-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
      >
        <FileDown size={18} /> PDF
      </button>
      <button
        onClick={exportExcel}
        className="p-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
      >
        <FileSpreadsheet size={18} /> Excel
      </button>
    </div>
  );
}
