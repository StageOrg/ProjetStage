"use client";
import React, { useState } from 'react';
import { UserPlus, Upload, AlertCircle, CheckCircle, X, RotateCw } from 'lucide-react';
import inscriptionService from '@/services/inscription/inscriptionService';
import { validateField } from '@/components/ui/ValidationUtils';

export default function CreationCompteEtudiant() {
  const [activeTab, setActiveTab] = useState('manuel');

  // États création manuelle
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    sexe: 'M'
  });

  // États de validation
  const [validationErrors, setValidationErrors] = useState({});

  // États import fichier
  const [file, setFile] = useState(null);

  // États renvoi identifiants
  const [recherche, setRecherche] = useState('');

  // États généraux
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validation en temps réel
    const error = validateField(name, value, true);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f && ['csv', 'xlsx', 'xls', 'pdf'].includes(f.name.split('.').pop().toLowerCase())) {
      setFile(f);
      setError(null);
    } else {
      setError('Format invalide (CSV, Excel ou PDF uniquement)');
      setFile(null);
    }
  };

  // 1. Création manuelle
  const submitManual = async () => {
    // Validation complète avant soumission
    const errors = {};
    errors.first_name = validateField('first_name', formData.first_name, true);
    errors.last_name = validateField('last_name', formData.last_name, true);
    errors.email = validateField('email', formData.email, true);
    
    // Filtrer les erreurs null
    const validErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== null)
    );
    
    if (Object.keys(validErrors).length > 0) {
      setValidationErrors(validErrors);
      return setError("Veuillez corriger les erreurs dans le formulaire");
    }
    
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await inscriptionService.creerCompteEtudiant(formData);
      setResult({
        success: true,
        message: "Compte créé avec succès ! L'étudiant recevra un email avec ses identifiants.",
        details: data
      });
      setFormData({ first_name: '', last_name: '', email: '', sexe: 'M' });
      setValidationErrors({});
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  // 2. Import fichier
  const submitFile = async () => {
    if (!file) return setError("Veuillez sélectionner un fichier");
    setLoading(true); setError(null); setResult(null);
    const fd = new FormData();
    fd.append('fichier', file);
    try {
      const blob = await inscriptionService.importerComptesEtudiants(fd);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'comptes_etudiants.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      setResult({ success: true, message: "Import réussi ! Le fichier des identifiants a été téléchargé.", isDownload: true });
      setFile(null);
      document.getElementById('fileInput')?.value && (document.getElementById('fileInput').value = '');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  // 3. Renvoyer identifiants
  const renvoyerIdentifiants = async () => {
    if (!recherche.trim()) return setError("Entrez un email ou nom d'utilisateur");
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await inscriptionService.renvoyerIdentifiants({ recherche });
      setResult({
        success: true,
        message: "Identifiants renvoyés avec succès !",
        details: res.etudiant
      });
      setRecherche('');
    } catch (err) {
      setError(err.response?.data?.error || "Étudiant non trouvé ou erreur d'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" px-4">
      <div className="max-w-4xl mx-auto ">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="w-9 h-9 text-blue-600" />
            Création de Comptes Étudiants
          </h1>
          <p className="text-gray-600 mt-2">
            Création manuelle • Import massif • Renvoyer les identifiants
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* 3 ONGLETS */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('manuel')}
              className={`flex-1 py-4 px-8 font-medium transition-colors ${activeTab === 'manuel' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Création Manuelle
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-4 px-8 font-medium transition-colors ${activeTab === 'import' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Import par Fichier
            </button>
            <button
              onClick={() => setActiveTab('renvoyer')}
              className={`flex-1 py-4 px-8 font-medium transition-colors ${activeTab === 'renvoyer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'} flex items-center justify-center gap-2`}
            >
              Renvoyer identifiants
            </button>
          </div>

          <div className="p-8">
            {/* Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-800 font-medium flex-1">{error}</span>
                <button onClick={() => setError(null)}><X className="w-5 h-5 text-red-600 hover:text-red-800" /></button>
              </div>
            )}
            {result && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-green-800 font-medium block">{result.message}</span>
                    {result.details && (
                      <div className="mt-3 bg-white rounded p-3 text-sm">
                        <p className="font-semibold text-gray-700 mb-2">Détails :</p>
                        <div className="space-y-1 text-gray-600">
                          <p><span className="font-medium">Username :</span> {result.details.username}</p>
                          <p><span className="font-medium">Email :</span> {result.details.email}</p>
                          {result.details.nouveau_mot_de_passe && (
                            <p><span className="font-medium">Nouveau mot de passe :</span> {result.details.nouveau_mot_de_passe}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setResult(null)}><X className="w-5 h-5 text-green-600 hover:text-green-800" /></button>
                </div>
              </div>
            )}

            {/* ONGLETS CONTENU */}
            {activeTab === 'manuel' && (
              /* ← Ton contenu manuel existant (je le remets intégralement) */
              <div className="space-y-5 max-w-2xl justify-center mx-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom <span className="text-red-500">*</span></label>
                    <input 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange} 
                      placeholder="Entrez le prénom" 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.first_name && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom <span className="text-red-500">*</span></label>
                    <input 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange} 
                      placeholder="Entrez le nom" 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.last_name && (
                      <p className="text-red-600 text-sm mt-1">{validationErrors.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="exemple@email.com" 
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexe <span className="text-red-500">*</span></label>
                  <select name="sexe" value={formData.sexe} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <button onClick={submitManual} disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium">
                  {loading ? <>Création en cours...</> : <>Créer le compte <UserPlus className="w-5 h-5" /></>}
                </button>
              </div>
            )}

            {activeTab === 'import' && (
              <div className="max-w-2xl mx-auto">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 transition-colors text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-700 mb-4">
                    Glissez votre fichier ici ou <label className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700">
                      cliquez pour sélectionner
                      <input id="fileInput" type="file" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFile} className="hidden" />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">Formats acceptés : CSV, Excel (.xlsx, .xls), PDF</p>
                  {file && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
                <button onClick={submitFile} disabled={loading || !file} className="mt-8 w-full px-10 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-3 font-medium">
                  {loading ? <>Import en cours...</> : <>Importer et générer les identifiants <Upload className="w-6 h-6" /></>}
                </button>
                 {/* Modèles Excel/CSV (inchangés) */}
                <div className="pt-4 border-t border-gray-200 text-center bg-gray-50 px-8 py-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Télécharger le modèle</p>
                  <div className="flex justify-center gap-6">
                    <a href="/templates/creation_compte_modele.xlsx" download className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors">
                      Modèle Excel (.xlsx)
                    </a>
                    <a href="/templates/creation_compte_modele.csv" download className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors">
                      Modèle CSV
                    </a>
                  </div>
                </div>
                    </div>     
            )}

            {/* 3ÈME ONGLET : RENVOYER IDENTIFIANTS */}
            {activeTab === 'renvoyer' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Renvoyer les identifiants</h2>
                  <p className="text-gray-600">Un étudiant n’a pas reçu son email ou le lien a expiré ?</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-amber-800 text-sm">
                  Un <strong>nouveau mot de passe temporaire</strong> sera généré et envoyé. Le lien sera valable <strong>10 jours</strong>.
                </div>
                <div className="space-y-5">
                  <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Email de l’étudiant"
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={renvoyerIdentifiants}
                    disabled={loading || !recherche.trim()}
                    className="w-full py-4 bg-orange-600 text-white text-lg font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <RotateCw className="w-6 h-6" />
                        Renvoyer les identifiants par email
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}