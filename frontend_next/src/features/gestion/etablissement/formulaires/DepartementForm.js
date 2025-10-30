"use client";
import { useState } from "react";
import DepartementService from "@/services/departementService";

export default function DepartementForm({ etablissementOptions = [{ id: 1, nom: "Ecole Polytechnique de Lomé", abbreviation: "EPL" }], onSuccess }) {
  const [nom, setNom] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [etablissement, setEtablissement] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      console.log("📡 Appel API Département :", { nom, abbreviation, etablissement });
      const response = await DepartementService.createDepartement(nom, abbreviation, etablissement);
      setMessage("✅ Département créé avec succès !");
      setNom("");
      setAbbreviation("");
      setEtablissement("1");
      if (onSuccess) onSuccess(response);// Pour rafraîchir la liste dans le parent
    } catch (error) {
      console.error("❌ Erreur API :", error);
      setMessage("❌ Erreur lors de la création du département.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 p-6 bg-white shadow-xl rounded-xl max-w-md mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center uppercase">
        Créer un Département
      </h2>

      {message && (
        <div
          className={`p-2 text-center rounded-lg ${
            message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <input
        type="text"
        placeholder="Nom du département"
        className="w-full border rounded-lg p-2"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Abréviation"
        className="w-full border rounded-lg p-2"
        value={abbreviation}
        onChange={(e) => setAbbreviation(e.target.value)}
        required
      />

      <select
        className="w-full border rounded-lg p-2"
        value={etablissement}
        onChange={(e) => setEtablissement(e.target.value)}
      >
        {etablissementOptions.map((eta) => (
          <option key={eta.id} value={eta.id}>{eta.nom}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
