import { useState } from "react";
import ParcoursService from "@/services/parcoursService";
export default function ParcoursForm({ onSuccess }) {
  const [libelle, setLibelle] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("✅ Formulaire soumis");
    setMessage({ type: "", text: "" });

    if (!libelle || !abbreviation) {
      setMessage({ type: "error", text: "Tous les champs sont obligatoires." });
      return;
    }

    setLoading(true);
    try {
      const response =await ParcoursService.createParcours(libelle, abbreviation);
      setMessage({
        type: "success",
        text: "Parcours créé avec succès !",
      });
      setLibelle("");
      setAbbreviation("");
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
      <h2 className="text-xl font-semibold text-gray-700">Créer un Parcours</h2>

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
        <label className="block text-gray-600 font-medium mb-1">Libellé</label>
        <input
          type="text"
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder=""
          className="w-full border rounded p-2 focus:ring focus:ring-teal-400"
          required
        />
      </div>

      <div>
        <label className="block text-gray-600 font-medium mb-1">Abréviation</label>
        <input
          type="text"
          value={abbreviation}
          onChange={(e) => setAbbreviation(e.target.value)}
          placeholder=""
          className="w-full border rounded p-2 focus:ring focus:ring-teal-400"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition disabled:opacity-50"
      >
        {loading ? "Création..." : "Créer"}
      </button>
    </form>
  );
}
