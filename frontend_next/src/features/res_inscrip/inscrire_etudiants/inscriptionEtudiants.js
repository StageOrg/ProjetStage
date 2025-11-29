"use client";
import api from '@/services/api';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Loader2, Check, X } from 'lucide-react';
import etudiantService from '@/services/etudiants/GestionEtudiantAdminService';
import { checkEmail, checkNumCarte } from '@/services/ValidationService';
import { validateField } from '@/components/ui/ValidationUtils';

export default function InscriptionEtudiantsAdmin() {
  const [activeTab, setActiveTab] = useState('manuel');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [parcoursData, setParcoursData] = useState([]);
  const [filieresDuParcours, setFilieresDuParcours] = useState([]);
  const [anneesDuParcours, setAnneesDuParcours] = useState([]);

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', telephone: '', date_naiss: '',
    lieu_naiss: '', num_carte: '', autre_prenom: '', sexe: 'M',
    parcours: '', filiere: '', annee_etude: ''
  });

  const [importFilters, setImportFilters] = useState({
    parcours: '', filiere: '', annee_etude: ''
  });

  const [importFilieres, setImportFilieres] = useState([]);
  const [importAnnees, setImportAnnees] = useState([]);

  // === VALIDATION EN TEMPS RÉEL ===
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState({ email: false, num_carte: false });
  const [debounceTimer, setDebounceTimer] = useState({});

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

  // Mise à jour des filières/années pour le formulaire manuel
  useEffect(() => {
    const parcoursSelected = parcoursData.find(p => p.id.toString() === form.parcours);
    if (parcoursSelected) {
      setFilieresDuParcours(parcoursSelected.filieres || []);
      setAnneesDuParcours(parcoursSelected.annees_etude || []);
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

  // Mise à jour des filtres d'import
  useEffect(() => {
    const parcoursSelected = parcoursData.find(p => p.id.toString() === importFilters.parcours);
    if (parcoursSelected) {
      setImportFilieres(parcoursSelected.filieres || []);
      setImportAnnees(parcoursSelected.annees_etude || []);
      if (importFilters.filiere && !parcoursSelected.filieres.some(f => f.id.toString() === importFilters.filiere)) {
        setImportFilters(prev => ({ ...prev, filiere: '' }));
      }
      if (importFilters.annee_etude && !parcoursSelected.annees_etude.some(a => a.id.toString() === importFilters.annee_etude)) {
        setImportFilters(prev => ({ ...prev, annee_etude: '' }));
      }
    } else {
      setImportFilieres([]);
      setImportAnnees([]);
    }
  }, [importFilters.parcours, parcoursData]);

  // === VALIDATION EN TEMPS RÉEL ===
  const validateAndCheck = async (name, value) => {
    // 1. Validation locale
    const localError = validateField(name, value, true);
    if (localError) {
      setErrors(prev => ({ ...prev, [name]: localError }));
      return;
    }

    // 2. Vérification backend (email, num_carte)
    if (name === 'email' || name === 'num_carte') {
      clearTimeout(debounceTimer[name]);
      setChecking(prev => ({ ...prev, [name]: true }));

      const timer = setTimeout(async () => {
        const checkFn = name === 'email' ? checkEmail : checkNumCarte;
        const result = await checkFn(value);

        if (result.erreur) {
          setErrors(prev => ({ ...prev, [name]: result.erreur }));
        } else if (result.existe) {
          setErrors(prev => ({ ...prev, [name]: name === 'email' ? "Email déjà utilisé" : "Numéro de carte déjà utilisé" }));
        } else {
          setErrors(prev => ({ ...prev, [name]: null }));
        }
        setChecking(prev => ({ ...prev, [name]: false }));
      }, 600);

      setDebounceTimer(prev => ({ ...prev, [name]: timer }));
    } else {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateAndCheck(name, value);
  };

  const handleImportFilterChange = (e) => {
    const { name, value } = e.target;
    setImportFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { 
    e.preventDefault(); 
    setIsDragging(false); 
    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); 
  };
  const handleFileSelect = (e) => { 
    if (e.target.files[0]) handleFileUpload(e.target.files[0]); 
  };

  const handleFileUpload = async (file) => {
    if (!importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude) {
      alert('Veuillez sélectionner un parcours, une filière et une année d\'étude avant d\'importer.');
      return;
    }

    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('parcours_id', importFilters.parcours);
    formData.append('filiere_id', importFilters.filiere);
    formData.append('annee_etude_id', importFilters.annee_etude);

    setIsLoading(true);
    try {
      const response = await api.post('/inscription/inscrire-etudiant/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `identifiants_import.csv`;
        a.click();
        alert('Import terminé ! Fichier CSV téléchargé.');
      } else {
        alert(`Import terminé : ${response.data.reussis} réussis, ${response.data.echoues} échoués.`);
      }

      setImportFilters({ parcours: '', filiere: '', annee_etude: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err) {
      alert('Erreur lors de l\'import : ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!form.parcours || !form.filiere || !form.annee_etude) {
      alert('Veuillez sélectionner un parcours, une filière et une année d\'étude.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/inscription/inscrire-etudiant/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        telephone: form.telephone || null,
        date_naiss: form.date_naiss || null,
        lieu_naiss: form.lieu_naiss || null,
        num_carte: form.num_carte || null,
        autre_prenom: form.autre_prenom || null,
        sexe: form.sexe,
        parcours_id: parseInt(form.parcours),
        filiere_id: parseInt(form.filiere),
        annee_etude_id: parseInt(form.annee_etude),
        ues_selectionnees: []
      });

      alert(`Étudiant créé ! Email envoyé à ${form.email}\nUsername: ${response.data.username}\nMot de passe: ${response.data.mot_de_passe_temporaire}`);

      setForm({
        first_name: '', last_name: '', email: '', telephone: '', date_naiss: '',
        lieu_naiss: '', num_carte: '', autre_prenom: '', sexe: 'M',
        parcours: '', filiere: '', annee_etude: ''
      });
      setErrors({});

    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyage des timers
  useEffect(() => {
    return () => {
      Object.values(debounceTimer).forEach(clearTimeout);
    };
  }, [debounceTimer]);

  // Vérification si le formulaire est valide
  const hasErrors = Object.values(errors).some(err => err !== null && err !== undefined);
  const isFormValid = 
    form.first_name && form.last_name && form.email && 
    form.parcours && form.filiere && form.annee_etude &&
    !hasErrors && !isLoading;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inscription des Étudiants</h1>
        <p className="text-gray-600 mt-1">Création manuelle ou import massif</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button onClick={() => setActiveTab('manuel')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manuel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Plus className="w-4 h-4 inline mr-2" /> Création manuelle
            </button>
            <button onClick={() => setActiveTab('import')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Upload className="w-4 h-4 inline mr-2" /> Import massif
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'manuel' && (
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Prénom */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input name="first_name" value={form.first_name} onChange={handleInputChange} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
                </div>

                {/* Nom */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input name="last_name" value={form.last_name} onChange={handleInputChange} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
                </div>

                {/* Email */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleInputChange} required className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                  <div className="absolute right-3 top-9">
                    {checking.email ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : errors.email ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : form.email && !errors.email ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Téléphone */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input name="telephone" value={form.telephone} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.telephone ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.telephone && <p className="mt-1 text-xs text-red-600">{errors.telephone}</p>}
                </div>

                {/* Date de naissance */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input name="date_naiss" type="date" value={form.date_naiss} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.date_naiss ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.date_naiss && <p className="mt-1 text-xs text-red-600">{errors.date_naiss}</p>}
                </div>

                {/* Lieu de naissance */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label>
                  <input name="lieu_naiss" value={form.lieu_naiss} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.lieu_naiss ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.lieu_naiss && <p className="mt-1 text-xs text-red-600">{errors.lieu_naiss}</p>}
                </div>

                {/* Num carte */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° Carte</label>
                  <input name="num_carte" value={form.num_carte} onChange={handleInputChange} placeholder="6 chiffres" className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.num_carte ? 'border-red-500' : 'border-gray-300'}`} />
                  <div className="absolute right-3 top-9">
                    {checking.num_carte ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : errors.num_carte ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : form.num_carte && !errors.num_carte ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  {errors.num_carte && <p className="mt-1 text-xs text-red-600">{errors.num_carte}</p>}
                </div>

                {/* Autre prénom */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Autre prénom</label>
                  <input name="autre_prenom" value={form.autre_prenom} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${errors.autre_prenom ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.autre_prenom && <p className="mt-1 text-xs text-red-600">{errors.autre_prenom}</p>}
                </div>

                {/* Sexe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
                  <select name="sexe" value={form.sexe} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                {/* Parcours */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcours *</label>
                  <select name="parcours" value={form.parcours} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Choisir --</option>
                    {parcoursData.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                  </select>
                </div>

                {/* Filière */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                  <select name="filiere" value={form.filiere} onChange={handleInputChange} required disabled={!form.parcours} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                    <option value="">-- Choisir --</option>
                    {filieresDuParcours.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>

                {/* Année d'étude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année d'étude *</label>
                  <select name="annee_etude" value={form.annee_etude} onChange={handleInputChange} required disabled={!form.parcours} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                    <option value="">-- Choisir --</option>
                    {anneesDuParcours.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => {
                  setForm({ first_name: '', last_name: '', email: '', telephone: '', date_naiss: '', lieu_naiss: '', num_carte: '', autre_prenom: '', sexe: 'M', parcours: '', filiere: '', annee_etude: '' });
                  setErrors({});
                }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button 
                  type="submit" 
                  disabled={!isFormValid}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Création...</> : <><Plus className="w-4 h-4" />Créer l'étudiant</>}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Sélectionner le parcours d'importation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parcours *</label>
                    <select name="parcours" value={importFilters.parcours} onChange={handleImportFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Choisir --</option>
                      {parcoursData.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                    <select name="filiere" value={importFilters.filiere} onChange={handleImportFilterChange} disabled={!importFilters.parcours} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                      <option value="">-- Choisir --</option>
                      {importFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année d'étude *</label>
                    <select name="annee_etude" value={importFilters.annee_etude} onChange={handleImportFilterChange} disabled={!importFilters.parcours} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                      <option value="">-- Choisir --</option>
                      {importAnnees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div 
                onDragOver={handleDragOver} 
                onDragLeave={handleDragLeave} 
                onDrop={handleDrop} 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                } ${!importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Glissez-déposez votre fichier ici</p>
                <p className="text-sm text-gray-500 mb-4">ou cliquez pour sélectionner (CSV, Excel, PDF)</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileSelect} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading || !importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude} 
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
                <h3 className="font-medium text-gray-900 mb-2">Format attendu</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Colonnes obligatoires: first_name, last_name, email</p>
                  <p>• Colonnes optionnelles: telephone, date_naiss, lieu_naiss, num_carte, autre_prenom, sexe</p>
                  <p>• Le parcours, la filière et l'année seront automatiquement appliqués à tous les étudiants importés</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}