import { useState } from "react";
import AnneeAcademiqueService from "@/services/anneeAcademiqueService";
export default function AnneeAcademiqueForm({ onSuccess }) {
  const [libelle, setLibelle] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!libelle || libelle.length !== 9 || !libelle.includes("-")) {
      setMessage({
        type: "error",
        text: "Le libellé doit être au format correct exemple: 2024-2025.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await AnneeAcademiqueService.createAnneeAcademique(libelle);
      setMessage({ type: "success", text: "Année académique créée avec succès !" });
      setLibelle("");
      if (onSuccess) onSuccess(response); // Pour rafraîchir la liste après création
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Erreur lors de la création.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-gray-700">Créer une Année Académique</h2>

      {message.text && (
        <div
          className={`p-2 text-sm rounded ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-gray-600 font-medium mb-1">Libellé (ex: 2024-2025)</label>
        <input
          type="text"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="2024-2025"
          className="w-full border rounded p-2 focus:ring focus:ring-teal-400"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer"}
      </button>
    </form>
  );
}
