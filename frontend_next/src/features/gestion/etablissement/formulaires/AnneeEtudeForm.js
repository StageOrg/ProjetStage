"use client";
import { useState } from "react";
import AnneeEtudeService from "@/services/anneeEtudeService";

export default function AnneeEtudeForm({ parcoursOptions, semestreOptions, onSuccess }) {
  const [libelle, setLibelle] = useState("");
  const [selectedParcours, setSelectedParcours] = useState([]);
  const [selectedSemestres, setSelectedSemestres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleMultiSelectChange = (e, setter) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setter(values);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!libelle || selectedParcours.length === 0 || selectedSemestres.length === 0) {
      setMessage("❌ Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const newAnnee = await AnneeEtudeService.createAnneeEtude(
        libelle,
        selectedParcours,
        selectedSemestres
      );
      setMessage("✅ Année d'étude créée avec succès !");
      
      // Réinitialiser le formulaire
      setLibelle("");
      setSelectedParcours([]);
      setSelectedSemestres([]);

      // Rafraîchir la liste dans le parent
      if (onSuccess) onSuccess(newAnnee);

    } catch (error) {
      console.error("Erreur création année:", error);
      setMessage("❌ Erreur lors de la création de l'année d'étude.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 bg-white rounded-lg" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-blue-600 mb-4 uppercase">
        Créer une Année d'Étude
      </h2>

      {message && (
        <div className={`p-2 rounded ${message.startsWith("✅") ? "bg-green-100" : "bg-red-100"}`}>
          {message}
        </div>
      )}

      <input
        type="text"
        placeholder="Libellé "
        className="w-full border rounded-lg p-2"
        value={libelle}
        onChange={(e) => setLibelle(e.target.value)}
        required
      />

      <label className="block text-sm font-medium text-gray-700">
        Choisir Parcours (Ctrl+clic pour plusieurs)
      </label>
      <select
        multiple
        className="w-full border rounded-lg p-2 h-32"
        value={selectedParcours}
        onChange={(e) => handleMultiSelectChange(e, setSelectedParcours)}
      >
        {parcoursOptions?.map((par) => (
          <option key={par.id} value={par.id}>
            {par.libelle}
          </option>
        ))}
      </select>

      <label className="block text-sm font-medium text-gray-700">
        Choisir Semestres (Ctrl+clic pour plusieurs)
      </label>
      <select
        multiple
        className="w-full border rounded-lg p-2 h-32"
        value={selectedSemestres}
        onChange={(e) => handleMultiSelectChange(e, setSelectedSemestres)}
      >
        {semestreOptions?.map((sem) => (
          <option key={sem.id} value={sem.id}>
            {sem.libelle}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded-lg text-white transition ${
          loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
