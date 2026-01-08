"use client";
import { useState } from "react";
import { HiUpload } from "react-icons/hi";
import { FaUsers } from "react-icons/fa";
import ImportExcelService from "@/services/importExcelService";

export default function ImportUsersExcel({ onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
    setShowDetails(false);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setResult({ message: "⚠️ Veuillez choisir un fichier Excel d'abord." });
      setMessageType("warning");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const data = await ImportExcelService.importUsers(formData);

      setResult(data);
      setMessageType(data.success ? "success" : "error");

      if (data.success && onSuccess) {
        onSuccess(data.users);
      }
    } catch (error) {
      setResult({ 
        success: false,
        message: "❌ Erreur lors de l'importation. Vérifiez le format du fichier.",
        error: error.message 
      });
      console.error(error);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await ImportExcelService.downloadTemplate();
    } catch (error) {
      console.error("Erreur lors du téléchargement du modèle:", error);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 ">
    <div className="flex flex-col gap-1 p-1 border rounded-xl shadow bg-white w-80 h-20 mx-auto ml-70">
      
       {/* Icône + titre + bouton modèle */}
  <div className="flex items-center gap-5">
    <FaUsers className="text-blue-600 text-lg" />
    <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
      Import utilisateurs
    </h3>

    <button
      onClick={downloadTemplate}
      className="text-[11px] px-2 py-1 rounded border border-blue-600 
                 text-blue-600 hover:bg-blue-50 transition whitespace-nowrap"
    >
      📥 Modèle
    </button>
  </div>

  {/* Zone upload + bouton importer */}
  <div className="flex items-center gap-2">
    <label
      htmlFor="userExcelInput"
      className="flex items-center justify-center cursor-pointer 
                 border border-dashed border-gray-300 rounded-md 
                 w-48 h-9 hover:border-blue-400 hover:text-blue-600 
                 transition text-gray-600 text-xs px-2 text-center"
    >
      <HiUpload className="text-sm mr-1" />
      {selectedFile ? (
        <span className="font-medium text-blue-600 truncate max-w-[130px]">
          {selectedFile.name}
        </span>
      ) : (
        "Fichier Excel"
      )}
    </label>

    <input
      type="file"
      id="userExcelInput"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleFileChange}
    />

    <button
      onClick={handleImport}
      disabled={isLoading || !selectedFile}
      className={`px-3 py-1.5 rounded-md text-white text-xs font-medium 
                  flex items-center gap-1 whitespace-nowrap ${
        isLoading || !selectedFile
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {isLoading && (
        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      )}
      {isLoading ? "Import..." : "Importer"}
    </button>
  </div>
</div>

      {/* Message résultat */}
      {result && (
        <div className="mt-2">
          {/* Message principal */}
          <div
            className={`p-3 rounded-lg text-sm ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : messageType === "warning"
                ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <p className="font-medium">{result.message}</p>

            {/* Statistiques */}
            {result.created_count !== undefined && (
              <div className="mt-2 flex gap-4 text-xs">
                <span>
                  ✅ <strong>{result.created_count}</strong> créé(s)
                </span>
                {result.errors && result.errors.length > 0 && (
                  <span>
                    ❌ <strong>{result.errors.length}</strong> ignoré(s)
                  </span>
                )}
              </div>
            )}

            {/* Bouton pour voir les détails */}
            {result.errors && result.errors.length > 0 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-xs underline hover:no-underline"
              >
                {showDetails ? "Masquer les détails" : "Voir les erreurs"}
              </button>
            )}
          </div>

          {/* Détails des erreurs */}
          {showDetails && result.errors && result.errors.length > 0 && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Détails des erreurs :
              </h4>
              {result.errors.map((error, index) => (
                <div key={index} className="mb-2 text-xs">
                  <span className="font-medium text-red-700">
                    Ligne {error.ligne} :
                  </span>
                  <ul className="ml-4 mt-1 list-disc list-inside text-red-600">
                    {error.erreurs.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Liste des utilisateurs créés (optionnel) */}
          {result.users && result.users.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Utilisateurs créés ({result.users.length}) :
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Rôle</th>
                      <th className="text-left p-2">Username</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.users.map((user, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="p-2">{user.nom} {user.prenoms}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-2 font-mono">{user.username}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                💡 Les mots de passe ont été générés automatiquement. Consultez la console pour les détails.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}