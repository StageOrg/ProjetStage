// app/res_inscrp/page.jsx
'use client';

import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, CheckCircle, Loader2 } from 'lucide-react';
import etudiantService from '@/services/etudiants/GestionEtudiantAdminService';
import RegistrationService from '@/services/inscription/registrationService';
import { format } from 'date-fns';

export default function InscriptionEtudiantsAdmin() {
  const [activeTab, setActiveTab] = useState('manuel');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // === DONNÉES DYNAMIQUES ===
  const [parcoursData, setParcoursData] = useState([]);
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);

  // Formulaire manuel
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    date_naiss: '',
    lieu_naiss: '',
    num_carte: '',
    autre_prenom: '',
    sexe: 'M',
    parcours: '',
    filiere: '',
    annee_etude: ''
  });

  // === CHARGER LES PARCOURS AU MONTAGE ===
  useEffect(() => {
    const fetchParcours = async () => {
      try {
        const parcours = await etudiantService.getParcoursAvecRelations();
        setParcoursData(parcours);
      } catch (err) {
        console.error("Erreur chargement parcours:", err);
      }
    };
    fetchParcours();
  }, []);

  // === MISE À JOUR DES FILIÈRES ET ANNÉES LORSQUE LE PARCOURS CHANGE ===
  useEffect(() => {
    const parcoursSelected = parcoursData.find(p => p.id.toString() === form.parcours);
    if (parcoursSelected) {
      setFilieresDuParcours(parcoursSelected.filieres || []);
      setAnneesDuParcours(parcoursSelected.annees_etude || []);

      // Réinitialiser si plus valide
      if (form.filiere && !parcoursSelected.filieres.some(f => f.id.toString() === form.filiere)) {
        setForm(prev => ({ ...prev, filiere: '' }));
      }
      if (form.annee_etude && !parcoursSelected.annees_etude.some(a => a.id.toString() === form.annee_etude)) {
        setForm(prev => ({ ...prev, annee_etude: '' }));
      }
    } else {
      setFilieresDuParcours([]);
      setAnneesDuParcours([]);
    }
  }, [form.parcours, parcoursData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) handleFileUpload(files[0]);
  };

  const handleFileUpload = async (file) => {
    alert('Import massif en cours de développement. Utilisez la création manuelle pour le moment.');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!form.parcours || !form.filiere || !form.annee_etude) {
      alert('Veuillez sélectionner un parcours, une filière et une année d\'étude.');
      return;
    }

    setIsLoading(true);
    try {
      // Générer identifiants temporaires
      const username = `${form.first_name.toLowerCase()}.${form.last_name.toLowerCase()}${Date.now().toString().slice(-4)}`;
      const password = Math.random().toString(36).slice(-8) + "A1!";

      const allData = {
        step1: { username, password, email: form.email },
        step2: {
          first_name: form.first_name,
          last_name: form.last_name,
          telephone: form.telephone || null,
          date_naiss: form.date_naiss || null,
          lieu_naiss: form.lieu_naiss || null,
          num_carte: form.num_carte || null,
          autre_prenom: form.autre_prenom || null,
          sexe: form.sexe,
          photoBase64: null,
          photoNom: null
        },
        step3: {
          parcours_id: parseInt(form.parcours),
          filiere_id: parseInt(form.filiere),
          annee_etude_id: parseInt(form.annee_etude)
        }
      };

      // Création via RegistrationService
      await RegistrationService.createCompleteRegistration(allData, []);

      alert(`Étudiant créé avec succès !\n\nUsername: ${username}\nMot de passe: ${password}`);

      // Réinitialiser le formulaire
      setForm({
        first_name: '', last_name: '', email: '', telephone: '', date_naiss: '',
        lieu_naiss: '', num_carte: '', autre_prenom: '', sexe: 'M',
        parcours: '', filiere: '', annee_etude: ''
      });

    } catch (error) {
      alert(error.message || 'Erreur lors de la création de l\'étudiant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inscription des Étudiants</h1>
              <p className="text-gray-600 mt-1">Création manuelle ou import massif</p>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span>Opération réussie !</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('manuel')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'manuel'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Création manuelle
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'import'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import massif
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* === CRÉATION MANUELLE === */}
            {activeTab === 'manuel' && (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                    <input name="first_name" value={form.first_name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input name="last_name" value={form.last_name} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input name="telephone" value={form.telephone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                    <input name="date_naiss" type="date" value={form.date_naiss} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                    <input name="lieu_naiss" value={form.lieu_naiss} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Carte</label>
                    <input name="num_carte" value={form.num_carte} onChange={handleInputChange} placeholder="6 chiffres" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autre prénom</label>
                    <input name="autre_prenom" value={form.autre_prenom} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                    <select name="sexe" value={form.sexe} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>

                  {/* === FILTRES DYNAMIQUES === */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parcours *</label>
                    <select
                      name="parcours"
                      value={form.parcours}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Choisir un parcours --</option>
                      {parcoursData.map(p => (
                        <option key={p.id} value={p.id}>{p.libelle}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                    <select
                      name="filiere"
                      value={form.filiere}
                      onChange={handleInputChange}
                      required
                      disabled={!form.parcours}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Choisir une filière --</option>
                      {filieresDuParcours.map(f => (
                        <option key={f.id} value={f.id}>{f.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année d'étude *</label>
                    <select
                      name="annee_etude"
                      value={form.annee_etude}
                      onChange={handleInputChange}
                      required
                      disabled={!form.parcours}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Choisir une année --</option>
                      {anneesDuParcours.map(a => (
                        <option key={a.id} value={a.id}>{a.libelle}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setForm({
                    first_name: '', last_name: '', email: '', telephone: '', date_naiss: '',
                    lieu_naiss: '', num_carte: '', autre_prenom: '', sexe: 'M',
                    parcours: '', filiere: '', annee_etude: ''
                  })} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Créer l'étudiant
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* === IMPORT MASSIF === */}
            {activeTab === 'import' && (
              <div className="space-y-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    ou cliquez pour sélectionner (CSV, Excel, PDF)
                  </p>
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileSelect} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Sélectionner un fichier
                  </button>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-lg">Import en cours...</span>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Format attendu (CSV/Excel)</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Colonnes obligatoires: first_name, last_name, email, filiere, parcours, annee_etude</p>
                    <p>• Colonnes optionnelles: telephone, date_naiss, lieu_naiss, num_carte, autre_prenom, sexe</p>
                    <p>• Un CSV de synthèse avec identifiants sera téléchargé automatiquement</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}