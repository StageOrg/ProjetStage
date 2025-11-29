import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User, Mail, Phone, Calendar, MapPin } from 'lucide-react';

export default function EditStudentModal({ isOpen, onClose, student, onSave }) {
  const [formData, setFormData] = useState({
    num_carte: '',
    first_name: '',
    last_name: '',
    autre_prenom: '',
    email: '',
    telephone: '',
    sexe: '',
    date_naiss: '',
    lieu_naiss: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire avec les données de l'étudiant
  useEffect(() => {
    if (student && isOpen) {
      setFormData({
        num_carte: student.num_carte || '',
        first_name: student.utilisateur?.first_name || student.first_name || '',
        last_name: student.utilisateur?.last_name || student.last_name || '',
        autre_prenom: student.autre_prenom || '',
        email: student.utilisateur?.email || student.email || '',
        telephone: student.utilisateur?.telephone || student.telephone || '',
        sexe: student.utilisateur?.sexe || student.sexe || '',
        date_naiss: student.date_naiss || '',
        lieu_naiss: student.lieu_naiss || ''
      });
      setErrors({});
    }
  }, [student, isOpen]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
   
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }
   
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }
   
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
   
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    }
   
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
    }
   
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
   
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Sauvegarde
  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!validateForm()) {
      return;
    }
   
    setLoading(true);
    try {
      await onSave(student.id, formData);
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErrors({ general: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            Modifier l'étudiant
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Erreur générale */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}
          {/* Numéro de carte */}
          <div className="mb-4">
            <label className="block text-black font-semibold mb-2 text-sm">
              Numéro de carte étudiant
            </label>
            <input
              type="text"
              name="num_carte"
              value={formData.num_carte}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-black"
            />
          </div>
          {/* Nom et Prénom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-black font-semibold mb-2 text-sm">
                Nom*
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-300'
                } text-black`}
                placeholder="Nom"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.last_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-black font-semibold mb-2 text-sm">
                Prénom*
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-300'
                } text-black`}
                placeholder="Prénom"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.first_name}
                </p>
              )}
            </div>
          </div>
          {/* Autre prénom */}
          <div className="mb-4">
            <label className="block text-black font-semibold mb-2 text-sm">
              Autre(s) prénom(s)
            </label>
            <input
              type="text"
              name="autre_prenom"
              value={formData.autre_prenom}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              placeholder="Autres prénoms"
            />
          </div>
          {/* Sexe */}
          <div className="mb-4">
            <label className="block text-black font-semibold mb-2 text-sm">
              Sexe*
            </label>
            <select
              name="sexe"
              value={formData.sexe}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.sexe ? 'border-red-500' : 'border-gray-300'
              } text-black`}
            >
              <option value="">-- Sélectionner --</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            {errors.sexe && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.sexe}
              </p>
            )}
          </div>
          {/* Email et Téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-black font-semibold mb-2 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                Email*
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } text-black`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-black font-semibold mb-2 text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                Téléphone*
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  errors.telephone ? 'border-red-500' : 'border-gray-300'
                } text-black`}
                placeholder="+228 90 12 34 56"
              />
              {errors.telephone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.telephone}
                </p>
              )}
            </div>
          </div>
          {/* Date et Lieu de naissance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-black font-semibold mb-2 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Date de naissance
              </label>
              <input
                type="date"
                name="date_naiss"
                value={formData.date_naiss}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
              />
            </div>
            <div>
              <label className="block text-black font-semibold mb-2 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                Lieu de naissance
              </label>
              <input
                type="text"
                name="lieu_naiss"
                value={formData.lieu_naiss}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                placeholder="Ville, Pays"
              />
            </div>
          </div>
          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}