"use client"
import React, { useState, useEffect } from 'react';
import { UserPlus, Upload, Download, AlertCircle, CheckCircle, X, FileText, FileSpreadsheet } from 'lucide-react';

export default function CreationCompteEtudiant() {
  const [activeTab, setActiveTab] = useState('manuel');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    telephone: '',
    sexe: 'M'
  });
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls', 'pdf'].includes(extension)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Format de fichier non supporté. Utilisez CSV, Excel ou PDF.');
        setFile(null);
      }
    }
  };

  const handleManualSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validation basique
      if (!formData.first_name || !formData.last_name || !formData.email) {
        throw new Error('Les champs prénom, nom et email sont obligatoires');
      }

      // Appel API
      const response = await fetch('/api/inscription/etudiant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Réponse invalide du serveur');
      }
      setResult({
        success: true,
        message: 'Compte créé avec succès ! Un email a été envoyé à l\'étudiant.',
        details: data
      });

      // Réinitialiser le formulaire
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        telephone: '',
        sexe: 'M'
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fichier', file);

      const response = await fetch('/api/inscription/etudiant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`Erreur HTTP ${response.status}`);
        }
        throw new Error(errorData.error || 'Erreur lors de l\'import');
      }

      // Si c'est un CSV de retour
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'identifiants_import.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setResult({
          success: true,
          message: 'Import réussi ! Le fichier des identifiants a été téléchargé.',
          isDownload: true
        });
      } else {
        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error('Réponse invalide du serveur');
        }
        setResult({
          success: true,
          message: `Import terminé : ${data.reussis} réussis, ${data.echoues} échoués`,
          details: data
        });
      }

      setFile(null);
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (format) => {
    const templates = {
      csv: `first_name,last_name,email,telephone,sexe
Jean,Dupont,jean.dupont@email.com,+228 90 12 34 56,M
Sophie,Martin,sophie.martin@email.com,+228 91 23 45 67,F`
    };

    if (format === 'csv') {
      const blob = new Blob([templates.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_etudiants.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-blue-600" />
            Créer des Comptes Étudiants
          </h1>
          <p className="text-gray-600 mt-2">
            Les identifiants et mots de passe sont générés automatiquement et envoyés par email
          </p>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('manuel')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                  activeTab === 'manuel'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserPlus className="w-5 h-5 inline-block mr-2" />
                Création Manuelle
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                  activeTab === 'import'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="w-5 h-5 inline-block mr-2" />
                Import de Fichier
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Messages de résultat/erreur */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Erreur</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {result && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium">Succès</p>
                  <p className="text-green-700 text-sm mt-1">{result.message}</p>
                  {result.details && !result.isDownload && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-200 text-sm space-y-1">
                      <p><strong>Username:</strong> {result.details.username}</p>
                      <p><strong>Email:</strong> {result.details.email}</p>
                      <p><strong>Mot de passe temporaire:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{result.details.mot_de_passe_temporaire}</span></p>
                      <p className="text-green-600 text-xs mt-2">✓ Email envoyé à l'étudiant</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setResult(null)} className="text-green-600 hover:text-green-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Contenu selon l'onglet */}
            {activeTab === 'manuel' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jean"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="jean.dupont@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder="+228 90 12 34 56"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sexe
                    </label>
                    <select
                      name="sexe"
                      value={formData.sexe}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🔑 Génération automatique</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Username:</strong> généré depuis prénom.nom (ex: jean.dupont)</li>
                    <li>• <strong>Mot de passe:</strong> 12 caractères aléatoires</li>
                    <li>• <strong>Email:</strong> envoyé avec les identifiants</li>
                    <li>• <strong>Changement obligatoire:</strong> à la première connexion</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Créer le Compte
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Templates */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Télécharger un template
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadTemplate('csv')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Template CSV
                    </button>
                    <button
                      onClick={() => alert('Créez un fichier Excel avec les colonnes: first_name, last_name, email, telephone, sexe')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Template Excel
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="text-xs text-gray-700 font-semibold mb-1">Colonnes requises :</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-mono bg-gray-100 px-1 rounded">first_name</span>, 
                      <span className="font-mono bg-gray-100 px-1 rounded ml-1">last_name</span>, 
                      <span className="font-mono bg-gray-100 px-1 rounded ml-1">email</span>
                    </p>
                    <p className="text-xs text-gray-700 font-semibold mt-2 mb-1">Colonnes optionnelles :</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-mono bg-gray-100 px-1 rounded">telephone</span>, 
                      <span className="font-mono bg-gray-100 px-1 rounded ml-1">sexe</span> (M ou F)
                    </p>
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label htmlFor="fileInput" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-semibold">
                        Cliquez pour sélectionner
                      </span>
                      <span className="text-gray-600"> ou glissez un fichier ici</span>
                    </label>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".csv,.xlsx,.xls,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Formats supportés: CSV, Excel (XLSX, XLS), PDF
                    </p>
                    {file && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900 font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            const fileInput = document.getElementById('fileInput');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleFileSubmit}
                      disabled={loading || !file}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Importer le Fichier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info PDF */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Format PDF:</strong> Le système extrait automatiquement les données structurées 
                    (champs avec "Nom:", "Prénom:", "Email:", etc.)
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>📥 Après l'import:</strong> Un fichier CSV avec tous les identifiants créés 
                    (username + mot de passe) sera automatiquement téléchargé. Conservez-le en lieu sûr !
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

       
      </div>
    </div>
  );
}