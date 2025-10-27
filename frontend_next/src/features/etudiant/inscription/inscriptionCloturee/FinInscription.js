"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function InscriptionFermee() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-2xl text-gray-800 mb-4">
          Inscriptions indisponibles. Veuillez contacter l'administration.
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}