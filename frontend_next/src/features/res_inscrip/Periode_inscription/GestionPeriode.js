"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Lock, Unlock, Edit2, Save, Info } from 'lucide-react';
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
      if (normalized) {
        setFormData(normalized);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('error', 'Erreur lors du chargement');
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
      setPeriode({ ...normalized });
      setFormData({ ...normalized });
      setIsEditing(false);
      setSaving(false);
    } catch (error) {
      console.error('❌ Erreur:', error);
      showMessage('error', 'Erreur lors de l\'enregistrement');
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    try {
      const newStatus = !periode.active;
      const result = await periodeInscriptionService.toggleActive(periode.id, newStatus);
      const normalized = normalizeDates(result);
      setPeriode({ ...normalized });
      setFormData({ ...normalized });
      showMessage('success', newStatus ? 'Inscriptions activées' : 'Inscriptions désactivées');
    } catch (error) {
      console.error('❌ Erreur toggle:', error);
      showMessage('error', 'Erreur lors de la modification');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // 🟢 NOUVELLE FONCTION : Calculer l'état réel des inscriptions
  const getEtatReel = () => {
    if (!periode) return null;

    const now = new Date();
    const debut = new Date(periode.date_debut);
    const fin = new Date(periode.date_fin);

    // Réinitialiser les heures pour comparaison précise
    now.setHours(0, 0, 0, 0);
    debut.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (!periode.active) {
      return {
        type: 'fermee',
        icon: Lock,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        titre: 'Fermé manuellement',
        description: 'Les inscriptions sont désactivées par le responsable',
        badge: '🔴 Fermé'
      };
    }

    if (now < debut) {
      return {
        type: 'programmee',
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        titre: 'Programmé',
        description: `Les inscriptions s'ouvriront le ${formatDate(periode.date_debut)}`,
        badge: '🔵 Programmé'
      };
    }

    if (now > fin) {
      return {
        type: 'expiree',
        icon: XCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        titre: 'Période expirée',
        description: `La période s'est terminée le ${formatDate(periode.date_fin)}`,
        badge: '⚠️ Expiré'
      };
    }

    return {
      type: 'ouverte',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      titre: 'Ouvert',
      description: `Les étudiants peuvent s'inscrire jusqu'au ${formatDate(periode.date_fin)}`,
      badge: '✅ En cours'
    };
  };

  const getStatutInfo = () => {
    if (!periode) {
      return {
        icon: XCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        text: 'Aucune période configurée',
        description: 'Créez une période d\'inscription'
      };
    }

    const etatReel = getEtatReel();
    return {
      icon: etatReel.icon,
      color: etatReel.color,
      bgColor: etatReel.bgColor === 'bg-red-50' ? 'bg-red-100' : 
               etatReel.bgColor === 'bg-blue-50' ? 'bg-blue-100' :
               etatReel.bgColor === 'bg-orange-50' ? 'bg-orange-100' : 'bg-green-100',
      text: etatReel.titre,
      description: etatReel.description
    };
  };

  const statutInfo = getStatutInfo();
  const StatutIcon = statutInfo.icon;
  const etatReel = getEtatReel();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-lg text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="text-center mt-2 mb-4">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-3 underline underline-offset-8 decoration-blue-600">
          <Calendar className="w-7 h-7 text-blue-600" />
          Gestion de la Période d'Inscription
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Configuration, activation et suivi des inscriptions
        </p>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 flex items-center gap-2 text-sm rounded ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Statut actuel */}
      <div className={`${statutInfo.bgColor} p-6 mb-5 rounded border ${statutInfo.color} border-opacity-30`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 ${statutInfo.bgColor} rounded-full`}>
            <StatutIcon className={`w-8 h-8 ${statutInfo.color}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${statutInfo.color}`}>{statutInfo.text}</h2>
            <p className="text-gray-700 text-sm">{statutInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white shadow rounded p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Configuration
          </h3>
          {!isEditing && periode && (
            <button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition"
            >
              <Edit2 className="w-3 h-3" />
              Modifier
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">
              Numéro de période*
            </label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  placeholder="Ex: P-2024-2025-S1"
                  className={`w-full px-3 py-2 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.numero ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numero && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.numero}
                  </p>
                )}
              </>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded text-gray-800 font-semibold text-sm">
                {periode?.numero || 'Non défini'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">
              Date de début*
            </label>
            {isEditing ? (
              <>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_debut ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_debut && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.date_debut}
                  </p>
                )}
              </>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded text-gray-800 font-semibold text-sm">
                {formatDate(periode?.date_debut)}
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold text-sm mb-1">
              Date de fin*
            </label>
            {isEditing ? (
              <>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    errors.date_fin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_fin && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.date_fin}
                  </p>
                )}
              </>
            ) : (
              <div className="px-3 py-2 bg-gray-50 rounded text-gray-800 font-semibold text-sm">
                {formatDate(periode?.date_fin)}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-semibold text-sm flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-semibold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 NOUVEAU : Contrôle ON/OFF amélioré avec badge d'état */}
      {periode && !isEditing && etatReel && (
        <div className="bg-white shadow rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Activation manuelle</h3>
              <p className="text-gray-600 text-sm">Activer/Désactiver les inscriptions</p>
            </div>
            
            <button
              onClick={toggleActive}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                periode.active ? 'bg-green-600 focus:ring-green-300' : 'bg-gray-400 focus:ring-gray-300'
              }`}
            >
              <span className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                periode.active ? 'translate-x-13' : 'translate-x-1'
              }`}>
                {periode.active ? (
                  <Unlock className="w-6 h-6 text-green-600 m-2" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-400 m-2" />
                )}
              </span>
            </button>
          </div>

          {/* 🟢 Badge d'état réel */}
          <div className={`p-4 rounded-lg border-2 ${etatReel.borderColor} ${etatReel.bgColor}`}>
            <div className="flex items-start gap-3">
              <etatReel.icon className={`w-6 h-6 ${etatReel.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold ${etatReel.color} text-base`}>
                    État actuel : {etatReel.titre}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/50">
                    {etatReel.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {etatReel.description}
                </p>
                
                {/* Info supplémentaire selon l'état */}
                {etatReel.type === 'programmee' && (
                  <div className="mt-3 p-2 bg-white/60 rounded text-xs">
                    <Info className="w-4 h-4 inline mr-1" />
                    <strong>Note :</strong> L'activation est prévue. Les étudiants verront cette période comme "à venir".
                  </div>
                )}
                
                {etatReel.type === 'expiree' && (
                  <div className="mt-3 p-2 bg-white/60 rounded text-xs">
                    <Info className="w-4 h-4 inline mr-1" />
                    <strong>Recommandation :</strong> Désactivez manuellement ou créez une nouvelle période.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!periode && (
        <div className="bg-white shadow rounded p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Aucune période configurée</h3>
          <p className="text-gray-600 text-sm mb-4">Créez une période pour commencer</p>
          <button 
            onClick={() => {
              setIsEditing(true);
              setFormData({ numero: '', date_debut: '', date_fin: '', active: false, responsable: null });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-semibold transition"
          >
            Créer une période
          </button>
        </div>
      )}
    </div>
  );
}