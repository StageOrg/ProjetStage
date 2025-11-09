"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Lock, Unlock, Edit2, Save } from 'lucide-react';
import periodeInscriptionService from '@/services/inscription/periodeInscriptionService';

export default function GestionPeriodeInscription() {
  const [periode, setPeriode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    date_debut: '',
    date_fin: '',
    active: false,
    responsable: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPeriode();
  }, []);

  const normalizeDates = (data) => {
    if (!data) return data;
    return {
      ...data,
      date_debut: data.date_debut?.split('T')[0] || data.date_debut,
      date_fin: data.date_fin?.split('T')[0] || data.date_fin
    };
  };

  const fetchPeriode = async () => {
    setLoading(true);
    try {
      const periodes = await periodeInscriptionService.getAllPeriodes();
      const periodeActive = periodes.find(p => p.active) || periodes[0] || null;
      const normalized = normalizeDates(periodeActive);
      setPeriode(normalized);
      if (normalized) setFormData(normalized);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('error', 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.numero.trim()) newErrors.numero = 'Le numéro est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin) newErrors.date_fin = 'La date de fin est requise';
    if (formData.date_debut && formData.date_fin) {
      if (new Date(formData.date_debut) >= new Date(formData.date_fin)) {
        newErrors.date_fin = 'La date de fin doit être après la date de début';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(periode);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(periode);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      let result;
      if (periode?.id) {
        result = await periodeInscriptionService.updatePeriode(periode.id, formData);
        showMessage('success', 'Période modifiée avec succès');
      } else {
        result = await periodeInscriptionService.createPeriode(formData);
        showMessage('success', 'Période créée avec succès');
      }
      const normalized = normalizeDates(result);
      setPeriode(normalized);
      setFormData(normalized);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('error', 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    try {
      const newStatus = !periode.active;
      const result = await periodeInscriptionService.toggleActive(periode.id, newStatus);
      const normalized = normalizeDates(result);
      setPeriode(normalized);
      setFormData(normalized);
      showMessage('success', newStatus ? 'Inscriptions activées' : 'Inscriptions désactivées');
    } catch (error) {
      console.error('Erreur toggle:', error);
      showMessage('error', 'Erreur lors de la modification');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEtatReel = () => {
    if (!periode) return null;
    const now = new Date();
    const debut = new Date(periode.date_debut);
    const fin = new Date(periode.date_fin);
    now.setHours(0, 0, 0, 0);
    debut.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (!periode.active) {
      return { type: 'fermee', icon: Lock, color: 'text-red-600', titre: 'Fermé manuellement', description: 'Les inscriptions sont désactivées par le responsable' };
    }
    if (now < debut) {
      return { type: 'programmee', icon: Clock, color: 'text-blue-600', titre: 'Programmé', description: `Ouverture le ${formatDate(periode.date_debut)}` };
    }
    if (now > fin) {
      return { type: 'expiree', icon: XCircle, color: 'text-orange-600', titre: 'Période expirée', description: `Terminée le ${formatDate(periode.date_fin)}` };
    }
    return { type: 'ouverte', icon: CheckCircle, color: 'text-green-600', titre: 'Ouvert', description: `Inscriptions ouvertes jusqu'au ${formatDate(periode.date_fin)}` };
  };

  const etatReel = getEtatReel();
  const StatutIcon = etatReel?.icon;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-300 border-t-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10"> 
      {/* Titre */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-4">
          <Calendar className="w-10 h-10 text-blue-600" />
          Gestion de la Période d'Inscription
        </h1>
        <p className="text-gray-600 text-base mt-3">Configuration, activation et suivi des inscriptions</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-8 p-5 flex items-center gap-4 text-base rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* État actuel */}
      {etatReel && (
        <div className="mb-10 p-6 rounded-xl bg-gray-50">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white rounded-full shadow-md">
              <StatutIcon className={`w-9 h-9 ${etatReel.color}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${etatReel.color}`}>{etatReel.titre}</h2>
              <p className="text-gray-700 text-base mt-1">{etatReel.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            Configuration de la période
          </h3>
          {!isEditing && periode && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-base font-semibold shadow-sm"
            >
              <Edit2 className="w-5 h-5" />
              Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* ESPACEMENT AUGMENTÉ */}
          {/* Numéro */}
          <div>
            <label className="block text-gray-700 font-semibold text-base mb-2">Numéro de période *</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  placeholder="Ex: P-2024-2025-S1"
                  className={`w-full px-4 py-3 rounded-xl text-base border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.numero ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numero && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.numero}
                  </p>
                )}
              </>
            ) : (
              <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-800 font-semibold text-base">
                {periode?.numero || 'Non défini'}
              </div>
            )}
          </div>

          {/* Date début */}
          <div>
            <label className="block text-gray-700 font-semibold text-base mb-2">Date de début *</label>
            {isEditing ? (
              <>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl text-base border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_debut ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_debut && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date_debut}
                  </p>
                )}
              </>
            ) : (
              <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-800 font-semibold text-base">
                {formatDate(periode?.date_debut)}
              </div>
            )}
          </div>

          {/* Date fin */}
          <div>
            <label className="block text-gray-700 font-semibold text-base mb-2">Date de fin *</label>
            {isEditing ? (
              <>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl text-base border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_fin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_fin && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date_fin}
                  </p>
                )}
              </>
            ) : (
              <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-800 font-semibold text-base">
                {formatDate(periode?.date_fin)}
              </div>
            )}
          </div>
        </div>

        {/* Boutons édition */}
        {isEditing && (
          <div className="flex gap-4 justify-end pt-4">
            <button
              onClick={handleCancel}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-semibold text-base"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold text-base disabled:opacity-50 flex items-center gap-3"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      {/* Contrôle ON/OFF */}
      {periode && !isEditing && (
        <div className="mt-12 p-8 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Activation manuelle</h3>
              <p className="text-gray-600 text-base">Activer ou désactiver les inscriptions</p>
            </div>
            <button
              onClick={toggleActive}
              className={`relative inline-flex h-14 w-28 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                periode.active ? 'bg-green-600 focus:ring-green-300' : 'bg-gray-400 focus:ring-gray-300'
              }`}
            >
              <span className={`inline-block h-12 w-12 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                periode.active ? 'translate-x-15' : 'translate-x-1'
              }`}>
                {periode.active ? (
                  <Unlock className="w-7 h-7 text-green-600 m-2.5" />
                ) : (
                  <Lock className="w-7 h-7 text-gray-400 m-2.5" />
                )}
              </span>
            </button>
          </div>

          <div className="p-5 bg-white rounded-xl shadow-sm">
            <div className="flex items-start gap-4">
              <StatutIcon className={`w-7 h-7 ${etatReel.color} mt-0.5`} />
              <div>
                <h4 className={`font-bold ${etatReel.color} text-lg`}>État actuel : {etatReel.titre}</h4>
                <p className="text-base text-gray-700 mt-1">{etatReel.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aucune période */}
      {!periode && (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-5" />
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Aucune période configurée</h3>
          <p className="text-gray-600 text-lg mb-8">Créez une période pour commencer</p>
          <button
            onClick={() => {
              setIsEditing(true);
              setFormData({ numero: '', date_debut: '', date_fin: '', active: false, responsable: null });
            }}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-lg shadow-md"
          >
            Créer une période
          </button>
        </div>
      )}
    </div>
  );
}