"use client";
import { useState } from "react";
import FiliereService from "@/services/filiereService";

export default function FiliereForm({ departementOptions, parcoursOptions, onSuccess }) {
  const [nom, setNom] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [departement, setDepartement] = useState("");
  const [selectedParcours, setSelectedParcours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleParcoursChange = (e) => {
    const value = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedParcours(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nom || !abbreviation || !departement) {
      setMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await FiliereService.createFiliere(
        nom,
        abbreviation,
        departement,
        selectedParcours
      );
      setMessage("✅ Filière créée avec succès !");
      setNom("");
      setAbbreviation("");
      setDepartement("");
      setSelectedParcours([]);

      //  Rafraîchir la liste dans le parent si onSuccess est fourni
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur lors de la création de la filière.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 bg-white rounded-lg shadow-md p-6" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-blue-600 mb-4">Créer une Filière</h2>

      {message && (
        <div className={`p-2 rounded ${message.startsWith("✅") ? "bg-green-100" : "bg-red-100"}`}>
          {message}
        </div>
      )}

      <input
        type="text"
        placeholder="Nom de la filière"
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
        value={departement}
        onChange={(e) => setDepartement(e.target.value)}
        required
      >
        <option value="">-- Choisir un département --</option>
        {departementOptions?.map((dep) => (
          <option key={dep.id} value={dep.id}>
            {dep.nom}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700">
        Sélectionner les parcours (Ctrl+clic pour plusieurs)
      </label>
      <select
        multiple
        className="w-full border rounded-lg p-2 h-32"
        value={selectedParcours}
        onChange={handleParcoursChange}
      >
        {parcoursOptions?.map((par) => (
          <option key={par.id} value={par.id}>
            {par.libelle}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded-lg text-white ${
          loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
