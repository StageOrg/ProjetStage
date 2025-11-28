"use client";
import React, { useState, useEffect } from "react";
import UEService from "@/services/ueService";
import { Save, AlertCircle, Edit2, Link as LinkIcon } from "lucide-react";
import UELibelle from "@/features/util/UELibelle";
import { useRouter } from "next/navigation";

export default function InfosUe({ ueId }) {
  const [formData, setFormData] = useState({
    description: "",
    lien_support: "",
    lien_tds: "",
    lien_evaluations: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  // Charger les infos actuelles de l’UE
  useEffect(() => {
    const fetchUE = async () => {
      try {
        const ue = await UEService.getUEById(ueId);
        setFormData({
          description: ue.description || "",
          lien_support: ue.lien_support || "",
          lien_tds: ue.lien_tds || "",
          lien_evaluations: ue.lien_evaluations || "",
        });
        // Si aucune info, passer directement en mode édition
        const hasInfo =
          ue.description || ue.lien_support || ue.lien_tds || ue.lien_evaluations;
        setEditing(!hasInfo);
      } catch (error) {
        console.error("Erreur lors du chargement de l’UE :", error);
      }
    };

    if (ueId) fetchUE();
  }, [ueId]);

  // Gestion des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sauvegarde
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      await UEService.updateUE(ueId, formData);
      setMessage("✅ Informations mises à jour avec succès !");
      setEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setMessage("❌ Impossible de mettre à jour l'UE.");
    } finally {
      setLoading(false);
    }
  };

  // Vérifie si au moins une info est présente
  const hasInfo =
    formData.description || formData.lien_support || formData.lien_tds || formData.lien_evaluations;

  return (
    <div>
    <div className="p-6 bg-white rounded-lg shadow-md mb-10">
       <button
          onClick={() => router.push(`/service-examen/notes/mes-ues/${ueId}/evaluations`)}
          className="ml-4 text-lg font-bold text-blue-800"
        >
          Evaluations de l'UE <UELibelle ueId={ueId} />
        </button> 
    </div>
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-bold text-blue-800 mb-4">
        Informations supplémentaires de l'UE <UELibelle ueId={ueId} />
      </h2>

      {message && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-700">
          <AlertCircle size={18} className="text-blue-600" />
          {message}
        </div>
      )}

      {/* Affichage des infos existantes si on n'est pas en édition */}
      {!editing && hasInfo && (
        <div className="flex flex-col gap-4">
          {formData.description && (
            <div className="flex items-start justify-between border p-3 rounded">
              <p>{formData.description}</p>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-800"
                title="Modifier la description"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}

          {formData.lien_support && (
            <div className="flex items-center justify-between border p-3 rounded">
              <a
                href={formData.lien_support}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-700 hover:underline"
              >
                <LinkIcon size={16} /> Lien vers le support du cours
              </a>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-800"
                title="Modifier le lien"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}

          {formData.lien_tds && (
            <div className="flex items-center justify-between border p-3 rounded">
              <a
                href={formData.lien_tds}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-700 hover:underline"
              >
                <LinkIcon size={16} /> Lien vers les TDs
              </a>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-800"
                title="Modifier le lien"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}

          {formData.lien_evaluations && (
            <div className="flex items-center justify-between border p-3 rounded">
              <a
                href={formData.lien_evaluations}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-700 hover:underline"
              >
                <LinkIcon size={16} /> Lien vers les évaluations passées
              </a>
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-800"
                title="Modifier le lien"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulaire si aucune info ou en édition */}
      {(editing || !hasInfo) && (
        <div className="flex flex-col gap-4 mt-2">
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description de l'unité d'enseignement"
            className="border p-2 rounded w-full"
            rows={3}
          />

          <input
            type="url"
            name="lien_support"
            value={formData.lien_support}
            onChange={handleChange}
            placeholder="Lien vers le support du cours"
            className="border p-2 rounded w-full"
          />

          <input
            type="url"
            name="lien_tds"
            value={formData.lien_tds}
            onChange={handleChange}
            placeholder="Lien vers les TDs"
            className="border p-2 rounded w-full"
          />

          <input
            type="url"
            name="lien_evaluations"
            value={formData.lien_evaluations}
            onChange={handleChange}
            placeholder="Lien vers les évaluations passées"
            className="border p-2 rounded w-full"
          />

          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
