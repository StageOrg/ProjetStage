// app/resp_inscription/page.jsx
'use client';
import Link from 'next/link';
import { Users, UserPlus, History } from 'lucide-react';

export default function InscriptionAdmin() {
  return (
    <div className="h-screen flex flex-col justify-between bg-transparent overflow-hidden">
      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto pt-16 pb-8 flex-grow">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Gestion des Inscriptions
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NOUVEAUX */}
          <Link href="/resp_inscription/dashboard/inscription/inscrire_etudiants">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-700">Nouveaux étudiants</h2>
              </div>
              <p className="text-gray-600">
                Création manuelle ou import CSV pour les primo-entrants.
              </p>
            </div>
          </Link>

          {/* ANCIENS */}
          <Link href="/resp_inscription/dashboard/inscription/Reinscription_anciens">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-700">Anciens étudiants</h2>
              </div>
              <p className="text-gray-600">
                Réinscription avec historique, UEs validées et rattrapage.
              </p>
            </div>
          </Link>
        </div>
        <Link href="/resp_inscription/dashboard/CreationCompte">
        <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-100 mt-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-purple-700">Créer des comptes</h2>
          </div>
          <p className="text-gray-600">
            Génération automatique des identifiants et envoi par email.
          </p>
        </div>
      </Link>

        {/* LIEN HISTORIQUE EN BLEU + SOULIGNÉ */}
        <div className="mt-12 text-center">
          <Link
            href="/resp_inscription/dashboard/inscription/historique"
            className="inline-flex items-center gap-3 text-blue-600 hover:text-blue-800 font-semibold text-lg transition-all hover:underline underline-offset-4 group"
          >
            <History className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Voir l’historique des identifiants créés
          </Link>
          <p className="text-sm text-gray-500 mt-2">
            Tous les comptes créés 
          </p>
        </div>
      </div>
      

      {/* Pied de page */}
      <div className="text-xs text-gray-400 mb-4 text-center select-none">
        © EPL {new Date().getFullYear()}
      </div>
    </div>
  );
}