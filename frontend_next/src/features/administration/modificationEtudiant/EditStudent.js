// EditStudentModal.js
"use client";
import React, { useState, useEffect } from "react";
import { FaTimes, FaSave } from "react-icons/fa";
import { validationPatterns, errorMessages, validateField } from "../path/to/your/validationFile"; // Ajustez le chemin

export default function EditStudentModal({ isOpen, onClose, student, onSave }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    num_carte: "",
    date_naiss: "",
    lieu_naiss: "",
    autre_prenom: "",
    sexe: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Configuration des champs pour la validation (tous optionnels car pré-remplis)
  const fieldsConfig = {
    first_name: { required: false },
    last_name: { required: false },
    email: { required: false },
    telephone: { required: false },
    num_carte: { required: false },
    date_naiss: { required: false },
    lieu_naiss: { required: false },
    autre_prenom: { required: false },
    sexe: { required: false },
  };

  useEffect(() => {
    if (student) {
      setFormData({
        first_name: student.utilisateur?.first_name || student.first_name || "",
        last_name: student.utilisateur?.last_name || student.last_name || "",
        email: student.utilisateur?.email || student.email || "",
        telephone: student.utilisateur?.telephone || student.telephone || "",
        num_carte: student.num_carte || "",
        date_naiss: student.date_naiss ? new Date(student.date_naiss).toISOString().split('T')[0] : "",
        lieu_naiss: student.lieu_naiss || "",
        autre_prenom: student.autre_prenom || "",
        sexe: student.sexe || "",
      });
      setErrors({});
    }
  }, [student]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value, fieldsConfig[name].required);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(fieldsConfig).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], fieldsConfig[fieldName].required);
      if (error) newErrors[fieldName] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await onSave(student.id, formData);
      onClose();
    } catch (error) {
      console.error("Erreur mise à jour étudiant:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Modifier l'étudiant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de carte</label>
              <input
                type="text"
                name="num_carte"
                value={formData.num_carte}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.num_carte && <p className="text-red-500 text-xs mt-1">{errors.num_carte}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              <input
                type="date"
                name="date_naiss"
                value={formData.date_naiss}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]} // Limite à aujourd'hui
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date_naiss && <p className="text-red-500 text-xs mt-1">{errors.date_naiss}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
              <input
                type="text"
                name="lieu_naiss"
                value={formData.lieu_naiss}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lieu_naiss && <p className="text-red-500 text-xs mt-1">{errors.lieu_naiss}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autre prénom</label>
              <input
                type="text"
                name="autre_prenom"
                value={formData.autre_prenom}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.autre_prenom && <p className="text-red-500 text-xs mt-1">{errors.autre_prenom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
              <select
                name="sexe"
                value={formData.sexe}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
              {errors.sexe && <p className="text-red-500 text-xs mt-1">{errors.sexe}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <FaSync className="animate-spin" /> : <FaSave />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}