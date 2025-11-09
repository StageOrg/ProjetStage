"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Loader2, Check, Search, UserCheck } from 'lucide-react';
import api from '@/services/api';
import etudiantService from '@/services/etudiants/GestionEtudiantAdminService';

export default function AnciensEtudiantsAdmin() {
  const [activeTab, setActiveTab] = useState('manuel');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // === PARCOURS ===
  const [parcoursData, setParcoursData] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);

  // === ONGLETS MANUEL ===
  const [numCarte, setNumCarte] = useState('');
  const [etudiantData, setEtudiantData] = useState(null);
  const [selectedUes, setSelectedUes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // === ONGLETS IMPORT ===
  const [importFilters, setImportFilters] = useState({
    parcours: '', filiere: '', annee_etude: ''
  });

  // === DEBUG : voir les données ===
  useEffect(() => {
    if (etudiantData) {
      console.log("ETUDIANT DATA:", etudiantData);
      console.log("UES DISPONIBLES:", etudiantData.ues_disponibles);
    }
  }, [etudiantData]);

  // === CHARGEMENT PARCOURS ===
  useEffect(() => {
    const fetchParcours = async () => {
      try {
        const data = await etudiantService.getParcoursAvecRelations();
        setParcoursData(data);
      } catch (err) {
        console.error("Erreur parcours:", err);
      }
    };
    fetchParcours();
  }, []);

  // === MISE À JOUR FILIÈRES/ANNÉES (IMPORT) ===
  useEffect(() => {
    const parcours = parcoursData.find(p => p.id.toString() === importFilters.parcours);
    if (parcours) {
      setFilieres(parcours.filieres || []);
      setAnnees(parcours.annees_etude || []);
      if (importFilters.filiere && !parcours.filieres.some(f => f.id.toString() === importFilters.filiere)) {
        setImportFilters(prev => ({ ...prev, filiere: '' }));
      }
      if (importFilters.annee_etude && !parcours.annees_etude.some(a => a.id.toString() === importFilters.annee_etude)) {
        setImportFilters(prev => ({ ...prev, annee_etude: '' }));
      }
    } else {
      setFilieres([]);
      setAnnees([]);
    }
  }, [importFilters.parcours, parcoursData]);

  // === ONGLET MANUEL : VÉRIFIER ÉTUDIANT ===
  const verifierEtudiant = async () => {
    if (!numCarte.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setEtudiantData(null);
    setSelectedUes([]);
    try {
      const res = await api.get(`/inscription/verifier-ancien-etudiant/${numCarte}/`);
      if (res.data.existe) {
        setEtudiantData(res.data);
      } else {
        setErrorMessage(res.data.message || 'Étudiant non trouvé');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Erreur serveur');
      console.error("Erreur vérification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUe = (ueId) => {
    setSelectedUes(prev => prev.includes(ueId) ? prev.filter(id => id !== ueId) : [...prev, ueId]);
  };

  const inscrireAncien = async () => {
    if (selectedUes.length === 0) {
      alert('Veuillez sélectionner au moins une UE');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        etudiant_id: etudiantData.etudiant.id,
        prochaine_annee_id: etudiantData.prochaine_annee?.id,
        ues_selectionnees: selectedUes
      };
      const res = await api.post('/inscription/ancien-etudiant/', payload);
      alert(`Réinscription réussie !\nNuméro: ${res.data.numero_inscription}`);
      setNumCarte('');
      setEtudiantData(null);
      setSelectedUes([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  // === ONGLET IMPORT : UPLOAD CSV ===
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  };

  const handleFileUpload = async (file) => {
    if (!importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude) {
      alert('Veuillez sélectionner parcours, filière et année');
      return;
    }
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('parcours_id', importFilters.parcours);
    formData.append('filiere_id', importFilters.filiere);
    formData.append('annee_etude_id', importFilters.annee_etude);

    setIsLoading(true);
    try {
      const res = await api.post('/inscription/import-anciens-etudiants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data instanceof Blob) {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement('a'); a.href = url; a.download = 'resultat_import_anciens.csv'; a.click();
        alert('Import terminé ! Fichier téléchargé.');
      } else {
        alert(`Import : ${res.data.reussis} réussis, ${res.data.echoues} échoués`);
      }
      setImportFilters({ parcours: '', filiere: '', annee_etude: '' });
      fileInputRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur import');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réinscription des Anciens Étudiants</h1>
        <p className="text-gray-600 mt-1">Manuelle ou par import massif</p>
      </div>

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
              <Plus className="w-4 h-4 inline mr-2" /> Manuelle
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" /> Import massif
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* === ONGLET MANUEL === */}
          {activeTab === 'manuel' && (
            <div className="space-y-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de carte</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={numCarte}
                    onChange={(e) => setNumCarte(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && verifierEtudiant()}
                    placeholder="Ex: 698547"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={verifierEtudiant}
                    disabled={isLoading || !numCarte.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Vérifier
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                  {errorMessage}
                </div>
              )}

              {etudiantData && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Étudiant trouvé</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <p><strong>Nom :</strong> {etudiantData.etudiant.nom} {etudiantData.etudiant.prenom}</p>
                      <p><strong>Email :</strong> {etudiantData.etudiant.email}</p>
                      <p><strong>Téléphone :</strong> {etudiantData.etudiant.telephone}</p>
                      <p><strong>N° carte :</strong> {etudiantData.etudiant.num_carte}</p>
                    </div>
                  </div>

                  {etudiantData.prochaine_annee && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-sm font-medium text-yellow-900">
                        Prochaine année : <strong>{etudiantData.prochaine_annee.libelle}</strong>
                      </p>
                    </div>
                  )}

                  <div className="border rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-3">Sélectionner les UEs</h3>
                    <div className="space-y-3">
                      {etudiantData?.ues_disponibles?.length > 0 ? (
                        etudiantData.ues_disponibles.map(ue => (
                          <label
                            key={ue.id}
                            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUes.includes(ue.id)}
                              onChange={() => toggleUe(ue.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {ue.code} - {ue.libelle} ({ue.nbre_credit} crédits)
                                {ue.composite && (
                                  <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    Composite
                                  </span>
                                )}
                                {ue.from_previous_year && (
                                  <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                    À rattraper
                                    {ue.moyenne_precedente !== null && ` (${ue.moyenne_precedente}/20)`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Aucune UE disponible pour cette inscription.
                        </p>
                      )}
                    </div>

                    {etudiantData.ues_validees?.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="font-medium text-green-800 mb-2">UEs validées</p>
                        <div className="text-xs text-green-700 space-y-1">
                          {etudiantData.ues_validees.map(ue => (
                            <div key={ue.id}>
                              <Check className="w-3 h-3 inline mr-1" />
                              {ue.code} - {ue.libelle}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={inscrireAncien}
                      disabled={isLoading || selectedUes.length === 0}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Inscription...
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-5 h-5" /> Confirmer
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* === ONGLET IMPORT === */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Filtres d'import</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parcours *</label>
                    <select
                      value={importFilters.parcours}
                      onChange={(e) => setImportFilters(prev => ({ ...prev, parcours: e.target.value, filiere: '', annee_etude: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choisir --</option>
                      {parcoursData.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                    <select
                      value={importFilters.filiere}
                      onChange={(e) => setImportFilters(prev => ({ ...prev, filiere: e.target.value }))}
                      disabled={!importFilters.parcours}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Choisir --</option>
                      {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                    <select
                      value={importFilters.annee_etude}
                      onChange={(e) => setImportFilters(prev => ({ ...prev, annee_etude: e.target.value }))}
                      disabled={!importFilters.parcours}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">-- Choisir --</option>
                      {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
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
                <p className="text-lg font-medium text-gray-700 mb-2">Glissez votre CSV ici</p>
                <p className="text-sm text-gray-500 mb-4">ou cliquez pour sélectionner</p>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Sélectionner
                </button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-lg">Import en cours...</span>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                <p>• CSV avec colonne <code>num_carte</code></p>
                <p>• Toutes les UEs disponibles seront inscrites</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}