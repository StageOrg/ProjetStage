"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import UEService from "@/services/ueService";
import UELibelle from "@/features/util/UELibelle";
pdfMake.vfs = pdfFonts.default ? pdfFonts.default.vfs : pdfFonts.vfs;

function ListeEtudiantsUE({ ueId }) {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true); 


  useEffect(() => {
    console.log("Fetching students for UE ID (inside component):", ueId);
    const fetchData = async () => {
      if (!ueId) return;
      try {
        const res = await UEService.getEtudiantsByUE(ueId);
        setEtudiants(res || []);
      } catch (err) {
        console.error("Erreur récupération des etudiants inscrits:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ueId]);

  // ✅ Export Excel
  const exportExcel = () => {
    const data = etudiants.map((etu) => {
      const row = {
        "N° Carte": etu.num_carte,
        Nom: etu.last_name,
        Prénom: etu.first_name,
        Sexe: etu.sexe,
        Semestre: ' ',
        Emmargement: ' ',
      };
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "notes.xlsx");
  };

  // ✅ Export PDF
  const exportPDF = () => {
    const body = [
      ["N° Carte", "Nom", "Prénom", "Sexe", "Semestre" , "Emmargement"]
    ];

    etudiants.forEach((etu) => {
      const row = [
        etu.num_carte,
        etu.last_name,
        etu.first_name,
        etu.sexe,
        ' ',
        ' '
      ];
      body.push(row);
    });

    const docDefinition = {
      content: [
        { text: "Liste des étudiants", style: "header" },
        { table: { headerRows: 1, body }, layout: "lightHorizontalLines" },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
      },
    };

    pdfMake.createPdf(docDefinition).download("ListeEmmargement.pdf");
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="bg-transparent px-8 py-10 w-full h-full animate-fade-in">
      
      {/* En-tête avec boutons d'export */} 
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl">{etudiants.length} Étudiants inscrits à l'UE <UELibelle ueId={ueId} /></h2>
        <div className="flex gap-3">
          <button onClick={exportPDF} className="p-2 bg-red-500 text-white rounded-lg flex items-center gap-2">
            <FileDown size={18} /> PDF
          </button>
          <button onClick={exportExcel} className="p-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>
      {/* Tableau */}
     
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">N° Carte</th>
            <th className="border px-2 py-1">Nom</th>
            <th className="border px-2 py-1">Prénom</th>
            <th className="border px-2 py-1">Sexe</th>
            <th className="border px-2 py-1">Semestre</th>
            <th className="border px-2 py-1">Emmargement</th>
          </tr>
        </thead>
        <tbody>
          {etudiants.map((etu, index) => (
            <tr key={etu.id} className="even:bg-gray-50">
              <td className="border px-2 py-1 text-center">{etu.num_carte}</td>
              <td className="border px-2 py-1">{etu.last_name}</td>
              <td className="border px-2 py-1">{etu.first_name}</td>
              <td className="border px-2 py-1 text-center">{etu.sexe}</td>
                <td className="border px-2 py-1 text-center">{' '}</td>
                <td className="border px-2 py-1 text-center">{' '}</td>
            </tr>
          ))
          }
         
        </tbody>
      </table>
    </div>
  );
}

export default ListeEtudiantsUE;
