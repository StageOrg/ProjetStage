"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, XCircle, AlertTriangle, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import periodeInscriptionService from '@/services/inscription/periodeInscriptionService';

export default function InscriptionFermee() {
  const router = useRouter();
  const [periode, setPeriode] = useState(null);
  const [statut, setStatut] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifierStatut();
  }, []);

  const verifierStatut = async () => {
    try {
      const result = await periodeInscriptionService.verifierStatutInscriptions();
      setStatut(result);
      setPeriode(result.periode);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du statut...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Bouton retour */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </button>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* En-tête avec icône */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-center">
            <div className="inline-block p-4 bg-white rounded-full mb-4">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Inscriptions Fermées
            </h1>
            <p className="text-red-100 text-lg">
              La période d'inscription n'est pas active
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8">

            {/* Coordonnées du responsable */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Coordonnées du Responsable des Inscriptions
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Bureau</p>
                    <p className="text-gray-800 font-semibold">
                      Bâtiment Administratif, Bureau 201
                    </p>
                  </div>
                </div>
            
                
  
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* Note en bas */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
             <strong>Astuce :</strong> Consultez régulièrement cette page ou notre site web pour être informé de l'ouverture de la prochaine période d'inscription.
          </p>
        </div>
      </div>
    </div>
  );
}