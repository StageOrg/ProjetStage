"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authAPI } from '@/services/authService';

export default function ResetPassword() {
  const router = useRouter();
  const params = useParams();
  
  // CORRECTION : Extraction robuste des paramètres
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid;
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Vérifier le token au chargement
  useEffect(() => {
    const verifierToken = async () => {
      try {
      // Vérification que uid et token existent
        if (!uid || !token) {
          setError("Lien de réinitialisation invalide");
          setValidToken(false);
          return;
        }
        
        await authAPI.verifierTokenReset(uid, token);
        setValidToken(true);
      } catch (err) {
        setError("Ce lien est invalide ou a expiré");
        setValidToken(false);
      } finally {
        setVerifying(false);
      }
    };

    if (uid && token) {
      verifierToken();
    } else {
      setVerifying(false);
      setError("Lien de réinitialisation invalide");
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    //  Vérification supplémentaire avant envoi
    if (!uid || !token) {
      setError("Lien de réinitialisation invalide");
      return;
    }

    setLoading(true);

    try {
      //  Les paramètres uid et token sont maintenant correctement extraits
      await authAPI.resetPassword(uid, token, password, confirmPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Lien invalide</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/forgot-password"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-4">Mot de passe réinitialisé !</h2>
          <p className="text-gray-700 mb-6">
            Votre mot de passe a été modifié avec succès.
          </p>
          <p className="text-sm text-gray-600">
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl px-8 py-10 w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-blue-900 mb-2 text-center">
          Nouveau mot de passe
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Choisissez un nouveau mot de passe sécurisé
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ mot de passe avec icône */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.768 2.392-2.505 4.428-4.773 5.657A9.956 9.956 0 0112 19c-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.509-4.158M6.223 6.223A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.967 9.967 0 01-3.053 4.307M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3l-6.223-6.223" />
                </svg>
              )}
            </button>
          </div>

          {/* Confirmation mot de passe avec icône */}
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="Retapez le mot de passe"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.768 2.392-2.505 4.428-4.773 5.657A9.956 9.956 0 0112 19c-4.478 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.509-4.158M6.223 6.223A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.967 9.967 0 01-3.053 4.307M15 12a3 3 0 00-3-3m0 0a3 3 0 013 3m-3-3l-6.223-6.223" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-blue-700 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}