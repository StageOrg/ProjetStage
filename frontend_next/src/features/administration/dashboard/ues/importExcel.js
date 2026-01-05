import { useState } from "react";
import { FaFileExcel } from "react-icons/fa";
import { HiUpload } from "react-icons/hi";
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
    <div className="flex flex-col items-center gap-2 p-2 border rounded-xl shadow bg-white w-full max-w-md mx-auto">

  <div className="flex items-center gap-2 w-full">
    
    {/* Zone d’upload stylée et compacte */}
    <label
      htmlFor="excelInput"
      className="flex flex-col items-center justify-center cursor-pointer 
                 border border-dashed border-gray-300 rounded-md 
                 w-full h-14 hover:border-blue-400 hover:text-blue-600 
                 transition text-gray-600"
    >
      <HiUpload className="text-lg mb-0.5" />
      <span className="text-[11px] leading-none text-center">
        {selectedFile ? selectedFile.name : "Choisir un fichier Excel"}
      </span>
    </label>

    {/* Input caché */}
    <input
      type="file"
      id="excelInput"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleFileChange}
    />

    {/* Bouton Import — plus petit */}
    <button
      onClick={handleImport}
      disabled={isLoading}
      className={`px-3 py-2 rounded-lg text-white text-sm flex items-center gap-1 ${
        isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {isLoading && (
        <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></span>
      )}
      {isLoading ? "..." : "Importer"}
    </button>

  </div>

  {/* Message résultat compact */}
  {result && (
    <div
      className={`mt-1 text-xs text-center transition-all ${
        messageType === "success"
          ? "text-green-600"
          : messageType === "warning"
          ? "text-yellow-600"
          : "text-red-600"
      }`}
    >
      <p>{result.message}</p>

      {result.ues_creees !== undefined && (
        <p className="mt-0.5">
          <strong>{result.ues_creees}</strong> UE importées •{" "}
          <strong>{result.ues_ignorees}</strong> ignorées • total{" "}
          <strong>{result.total_lignes}</strong>
        </p>
      )}
    </div>
  )}

</div>

  );
}
