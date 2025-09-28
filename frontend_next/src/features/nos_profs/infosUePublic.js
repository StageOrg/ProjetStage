"use client";
import React, { useState, useEffect } from "react";
import UEService from "@/services/ueService";
import { Link as LinkIcon, AlertCircle } from "lucide-react";

export default function InfosUePublic({ ueId }) {
  const [formData, setFormData] = useState({
    description: "",
    lien_support: "",
    lien_tds: "",
    lien_evaluations: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Charger les infos de l’UE
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
      } catch (error) {
        console.error("Erreur lors du chargement de l’UE :", error);
        setMessage("❌ Impossible de charger les informations de l'UE.");
      } finally {
        setLoading(false);
      }
    };

    if (ueId) fetchUE();
  }, [ueId]);

  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-md p-6 rounded shadow w-full max-w-3xl mx-auto text-center">
        Chargement des informations de l'UE...
      </div>
    );
  }

  const hasInfo =
    formData.description || formData.lien_support || formData.lien_tds || formData.lien_evaluations;

  if (!hasInfo) {
    return (
      <div className="bg-white/50 backdrop-blur-md p-6 rounded shadow w-full max-w-3xl mx-auto text-center text-gray-500">
        Aucune information disponible pour cette UE.
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-md p-6 rounded shadow w-full max-w-3xl mx-auto flex flex-col gap-4">
      {message && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <AlertCircle size={18} className="text-blue-600" />
          {message}
        </div>
      )}

      {formData.description && (
        <div className="border p-3 rounded">
          <h3 className="font-bold mb-2">Description de l'UE </h3>
          <p>{formData.description}</p>
        </div>
      )}

      {formData.lien_support && (
        <div className="flex items-center border p-3 rounded">
          <a
            href={formData.lien_support}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-700 hover:underline"
          >
            <LinkIcon size={16} /> Lien vers le support du cours
          </a>
        </div>
      )}

      {formData.lien_tds && (
        <div className="flex items-center border p-3 rounded">
          <a
            href={formData.lien_tds}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-700 hover:underline"
          >
            <LinkIcon size={16} /> Lien vers les TDs
          </a>
        </div>
      )}

      {formData.lien_evaluations && (
        <div className="flex items-center border p-3 rounded">
          <a
            href={formData.lien_evaluations}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-700 hover:underline"
          >
            <LinkIcon size={16} /> Lien vers les évaluations passées
          </a>
        </div>
      )}
    </div>
  );
}
