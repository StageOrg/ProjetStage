"use client";
import api from '@/services/api';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Loader2, Check, X, Download } from 'lucide-react';
import etudiantService from '@/services/etudiants/GestionEtudiantAdminService';

export default function AnciensEtudiantsAdmin() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [formatExport, setFormatExport] = useState('csv');

  const [parcoursData, setParcoursData] = useState([]);
  const [importFilieres, setImportFilieres] = useState([]);
  const [importAnnees, setImportAnnees] = useState([]);

  const [importFilters, setImportFilters] = useState({
    parcours: '', filiere: '', annee_etude: ''
  });

  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const fetchParcours = async () => {
      try {
        const parcours = await etudiantService.getParcoursAvecRelations();
        setParcoursData(parcours);
      } catch (err) {
        console.error("Erreur:", err);
      }
    };
    fetchParcours();
  }, []);

  useEffect(() => {
    const parcoursSelected = parcoursData.find(p => p.id.toString() === importFilters.parcours);
    if (parcoursSelected) {
      setImportFilieres(parcoursSelected.filieres || []);
      setImportAnnees(parcoursSelected.annees_etude || []);
    } else {
      setImportFilieres([]);
      setImportAnnees([]);
    }
  }, [importFilters.parcours, parcoursData]);

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
      alert('Veuillez sélectionner parcours, filière et année.');
      return;
    }

    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('parcours_id', importFilters.parcours);
    formData.append('filiere_id', importFilters.filiere);
    formData.append('annee_etude_id', importFilters.annee_etude);
    formData.append('format', formatExport);

    setIsLoading(true);
    setImportResult(null);

    try {
      const res = await api.post('/inscription/import-anciens-etudiants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      // Téléchargement
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resultat_import_anciens.${formatExport === 'excel' ? 'xlsx' : formatExport}`;
      a.click();

      // Affichage résultat
      const text = await res.data.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, idx) => obj[h] = values[idx] || '');
        data.push(obj);
      }
      setImportResult(data);

    } catch (err) {
      alert(err.response?.data?.error || 'Erreur import');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Massif - Anciens Étudiants</h1>
        <p className="text-gray-600">Inscription automatique avec rattrapage (max 70 crédits)</p>

        <div className="mt-6 space-y-6">
          {/* Filtres */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Filtres d'import</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcours *</label>
                <select name="parcours" value={importFilters.parcours} onChange={(e) => setImportFilters(prev => ({ ...prev, parcours: e.target.value, filiere: '', annee_etude: '' }))} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">-- Choisir --</option>
                  {parcoursData.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                <select name="filiere" value={importFilters.filiere} onChange={(e) => setImportFilters(prev => ({ ...prev, filiere: e.target.value }))} disabled={!importFilters.parcours} className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100">
                  <option value="">-- Choisir --</option>
                  {importFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année *</label>
                <select name="annee_etude" value={importFilters.annee_etude} onChange={(e) => setImportFilters(prev => ({ ...prev, annee_etude: e.target.value }))} disabled={!importFilters.parcours} className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100">
                  <option value="">-- Choisir --</option>
                  {importAnnees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Format :</label>
                  <select value={formatExport} onChange={(e) => setFormatExport(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Zone de dépôt */}
          <div 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} ${!importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude ? 'opacity-50' : ''}`}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Glissez-déposez votre fichier</p>
            <p className="text-sm text-gray-500 mb-4">CSV, Excel, PDF (uniquement num_carte)</p>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || !importFilters.parcours || !importFilters.filiere || !importFilters.annee_etude} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Sélectionner
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">Import en cours...</span>
            </div>
          )}

          {/* Résultat */}
          {importResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <p className="font-semibold text-lg mb-3">
                Résultat : <span className="text-green-600">{importResult.filter(r => r.statut === 'réussi').length} réussis</span>, 
                <span className="text-red-600"> {importResult.filter(r => r.statut === 'échoué').length} échoués</span>
              </p>
              <div className="text-xs space-y-1 max-h-64 overflow-y-auto font-mono">
                {importResult.map((r, i) => (
                  <div key={i} className={`p-1 rounded ${r.statut === 'réussi' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    [{r.num_carte}] {r.nom || 'Inconnu'} → {r.statut}
                    {r.statut === 'réussi' && ` (${r.total_credits} crédits)`}
                    {r.erreur && ` → ${r.erreur}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <a href="/modele_import_anciens.csv" download className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Download className="w-4 h-4" /> Modèle CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}