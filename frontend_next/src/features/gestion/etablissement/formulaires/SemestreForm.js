"use client";
import { useState } from "react";
import SemestreService from "@/services/semestreService";



export default function SemestreForm({ onSuccess }) {
  const [libelle, setLibelle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!libelle){
      setMessage("Veuillez remplir le champ obligatoire.");
      return; 
    } 
    setLoading(true);
    setMessage("");
    try {
      const response = await SemestreService.createSemestre(libelle);
      setMessage("✅ Semestre créée avec succès !");
      setLibelle("");
      //  Rafraîchir la liste dans le parent si onSuccess est fourni
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error("Erreur lors de la création du semestre :", error);
      setMessage("❌ Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-blue-600 mb-4">Créer un Semestre</h2>
      {message && (
        <div className={`p-2 rounded ${message.startsWith("✅") ? "bg-green-100" : "bg-red-100"}`}>
          {message}
        </div>
      )}
      <input
        type="text"
        placeholder="Libellé du semestre"
        className="w-full border rounded-lg p-2"
        value={libelle}
        onChange={(e) => setLibelle(e.target.value)}
      />

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
