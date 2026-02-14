"use client";
import React from "react";

export default function ConfirmationModal({ isOpen, data, onConfirm, onCancel, limitCredits = 70 }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl relative">
        {/* Bouton close (X en haut droite) */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Titre */}
        <h3 className="text-base sm:text-lg font-bold mb-4 text-center pr-6">Confirmer l'inscription ?</h3>

        {/* Résumé données */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-xs sm:text-sm bg-gray-50 p-3 sm:p-4 rounded-lg">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Type d'étudiant :</span>
            <span className="text-gray-900">{data?.type || 'Nouveau'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Filière :</span>
            <span className="text-gray-900">{data?.infos?.filiere_nom || 'Non sélectionné'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Parcours :</span>
            <span className="text-gray-900">{data?.infos?.parcours_libelle || 'Non sélectionné'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Année d'étude :</span>
            <span className="text-gray-900">{data?.infos?.annee_etude_libelle || 'Non sélectionné'}</span>
          </div>

          <hr className="my-2" />

          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Nombre d'UEs :</span>
            <span className="text-gray-900 font-bold">{data?.uesCount || 0}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Crédits total :</span>
            <span className={`font-bold ${data?.totalCredits > limitCredits ? 'text-red-600' : 'text-green-600'}`}>
              {data?.totalCredits || 0}/{limitCredits}
            </span>
          </div>
        </div>

        {/* Message de confirmation */}
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 text-center">
          Êtes-vous sûr de vouloir finaliser votre inscription avec ces informations ?
        </p>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}