"use client";
import React, { useState, useEffect } from "react";
import UEService from "@/services/ueService";
import { Link as LinkIcon, AlertCircle } from "lucide-react";

export default function InfosUePublic({ ueId }) {
  console.log("UE ID reçue :", ueId);
  const [formData, setFormData] = useState({
    description: "",
    lien_cours: "",
    lien_td: "",
    lien_evaluation: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const role = localStorage.getItem("user_role");

  // Charger les infos de l’UE
  useEffect(() => {
    const fetchUE = async () => {
      try {
        const ue = await UEService.getUEById(ueId);
        setFormData({
          description: ue.description || "",
          lien_cours: ue.lien_cours || "",
          lien_td: ue.lien_td || "",
          lien_evaluation: ue.lien_evaluation || "",
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
    formData.description || formData.lien_cours || formData.lien_td || formData.lien_evaluation;

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
     {role === "etudiant" && (
  <>
    {formData.lien_cours && (
      <div className="flex items-center border p-3 rounded">
        <a
          href={formData.lien_cours}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-700 hover:underline"
        >
          <LinkIcon size={16} /> Lien vers le support du cours
        </a>
      </div>
    )}

    {formData.lien_td && (
      <div className="flex items-center border p-3 rounded">
        <a
          href={formData.lien_td}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-700 hover:underline"
        >
          <LinkIcon size={16} /> Lien vers les TDs
        </a>
      </div>
    )}

    {formData.lien_evaluation && (
      <div className="flex items-center border p-3 rounded">
        <a
          href={formData.lien_evaluation}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-700 hover:underline"
        >
          <LinkIcon size={16} /> Lien vers les évaluations passées
        </a>
      </div>
    )}
  </>
)}

    </div>
  );
}
