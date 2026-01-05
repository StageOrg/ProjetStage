"use client";
import React, { useState, useEffect } from "react";
import UEService from "@/services/ueService";

export default function ModifUE({ 
  ue, 
  filiereOptions, 
  parcoursOptions, 
  anneesEtudeOptions, 
  semestreOptions, 
  onSuccess,
  onCancel 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    libelle: '',
    code: '',
    nbre_credit: '',
    composite: false,
    parcours: [],
    filiere: [],
    annee_etude: [],
    semestre: ''
  });

  // Initialiser le formulaire avec les données de l'UE
  useEffect(() => {
    if (ue) {
      setFormData({
        libelle: ue.libelle || '',
        code: ue.code || '',
        nbre_credit: ue.nbre_credit || '',
        composite: ue.composite || false,
        parcours: Array.isArray(ue.parcours) ? ue.parcours : [ue.parcours].filter(Boolean),
        filiere: Array.isArray(ue.filiere) ? ue.filiere : [ue.filiere].filter(Boolean),
        annee_etude: Array.isArray(ue.annee_etude) ? ue.annee_etude : [ue.annee_etude].filter(Boolean),
        semestre: ue.semestre || ''
      });
    }
  }, [ue]);

  // Fonction pour gérer les sélections multiples
  const handleMultiSelect = (field, value, isSelected) => {
    setFormData(prev => ({
      ...prev,
      [field]: isSelected 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedUE = await UEService.updateUE(
        ue.id,
        {libelle: formData.libelle,
        code: formData.code,
        nbre_credit: parseInt(formData.nbre_credit),
        composite: formData.composite,
        parcours: formData.parcours,
        filiere: formData.filiere,
        annee_etude: formData.annee_etude,
        semestre: formData.semestre} 
      );
      
      if (onSuccess) onSuccess(updatedUE);
      console.log("UE modifiée avec succès:", updatedUE);
    } catch (error) {
      console.error("Erreur lors de la modification de l'UE:", error);
      alert("Erreur lors de la modification de l'UE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {/* Libelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Libellé:
          </label>
          <input
            type="text"
            value={formData.libelle}
            onChange={(e) => setFormData(prev => ({...prev, libelle: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code:
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({...prev, code: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Nombre de crédits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de crédits:
          </label>
          <input
            type="number"
            value={formData.nbre_credit}
            onChange={(e) => setFormData(prev => ({...prev, nbre_credit: e.target.value}))}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Composite */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="composite"
            checked={formData.composite}
            onChange={(e) => setFormData(prev => ({...prev, composite: e.target.checked}))}
            className="mr-2"
          />
          <label htmlFor="composite" className="text-sm font-medium text-gray-700">
            Composite
          </label>
        </div>

        {/* Parcours (sélection multiple) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parcours:
          </label>
          <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
            {parcoursOptions?.map((p) => (
              <div key={p.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`parcours-${p.id}`}
                  checked={formData.parcours.includes(p.id)}
                  onChange={(e) => handleMultiSelect('parcours', p.id, formData.parcours.includes(p.id))}
                  className="mr-2"
                />
                <label htmlFor={`parcours-${p.id}`} className="text-sm">
                  {p.libelle}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Filière (sélection multiple) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filière:
          </label>
          <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
            {filiereOptions?.map((f) => (
              <div key={f.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`filiere-${f.id}`}
                  checked={formData.filiere.includes(f.id)}
                  onChange={(e) => handleMultiSelect('filiere', f.id, formData.filiere.includes(f.id))}
                  className="mr-2"
                />
                <label htmlFor={`filiere-${f.id}`} className="text-sm">
                  {f.abbreviation} - {f.libelle}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Année d'étude (sélection multiple) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Année d'étude:
          </label>
          <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
            {anneesEtudeOptions?.map((a) => (
              <div key={a.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`annee-${a.id}`}
                  checked={formData.annee_etude.includes(a.id)}
                  onChange={(e) => handleMultiSelect('annee_etude', a.id, formData.annee_etude.includes(a.id))}
                  className="mr-2"
                />
                <label htmlFor={`annee-${a.id}`} className="text-sm">
                  {a.libelle}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Semestre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semestre:
          </label>
          <select
            value={formData.semestre}
            onChange={(e) => setFormData(prev => ({...prev, semestre: e.target.value}))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Sélectionnez un semestre</option>
            {semestreOptions?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Modification...' : 'Modifier'}
          </button>
        </div>
      </form>
    </div>
  );
}