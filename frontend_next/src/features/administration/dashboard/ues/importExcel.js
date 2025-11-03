import { useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { FileSpreadsheet } from "lucide-react";
import ImportExcelService  from "@/services/importExcelService";

export default function ImportUEExcel({onSuccess}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [messageType, setMessageType] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setResult({ message: "⚠️ Veuillez choisir un fichier Excel d’abord." });
      setMessageType("warning");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const data = await ImportExcelService.importUEs(formData);
      setResult(data);
      const ues_creees = data.ues;
      setMessageType("success");
      if (onSuccess) onSuccess(ues_creees);
    } catch (error) {
      setResult({ message: "❌ Erreur lors de l’importation. Revoyez le format du fichier." });
      console.error(error);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 border rounded-2xl shadow-lg bg-white">
      <div className="flex align-middle gap-1">
         <label
        htmlFor="excelInput"
        className="flex items-align  cursor-pointer bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition"
      >
      
      <FileSpreadsheet size={18} /> 
      {selectedFile ? selectedFile.name : "Excel"}
      </label>
      <input
        type="file"
        id="excelInput"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleImport}
        disabled={isLoading}
        className={`px-4 py-2 rounded-xl text-white flex items-center gap-2 ${
          isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        )}
        {isLoading ? "Importation..." : "Importer"}
      </button>
      </div>
     

      {result && (
        <div
          className={`mt-3 text-sm text-center transition-all ${
            messageType === "success"
              ? "text-green-600"
              : messageType === "warning"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          <p>{result.message}</p>
          {result.ues_creees !== undefined && (
            <p>
              <strong>{result.ues_creees}</strong> UE importées,{" "}
              <strong>{result.ues_ignorees}</strong> ignorées sur{" "}
              <strong>{result.total_lignes}</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
