'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

export default function PremiereConnexion() {
  const { uid, token } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTemp, setLoadingTemp] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const pwdParam = searchParams.get('pwd');
    
    if (pwdParam) {
      try {
        const decoded = atob(pwdParam);
        setTemporaryPassword(decoded);
      } catch (e) {
        setError("Impossible de récupérer le mot de passe temporaire");
      }
    } else {
      setError("Lien invalide : mot de passe manquant");
    }
    
    setLoadingTemp(false);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/inscription/set-password/', {
        uid,
        token,
        new_password: password
      });
      
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="mb-4">
            <svg 
              className="w-16 h-16 text-green-500 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Mot de passe défini !
          </h2>
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Definir le mot de passe</h2>
        
        {loadingTemp ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Mot de passe temporaire */}
            <input
              type="text"
              value={temporaryPassword}
              readOnly
              className="w-full px-4 py-2 border border-yellow-300 rounded-lg bg-yellow-50 cursor-not-allowed text-gray-800"
              placeholder="Mot de passe temporaire"
            />

            {/* Nouveau mot de passe */}
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />

            {/* Confirmer le mot de passe */}
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={8}
            />

            {/* Case à cocher */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="show-password" className="text-sm text-gray-700 cursor-pointer">
                Afficher les mots de passe
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading || !temporaryPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Envoi...' : 'Définir le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}