'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ProfesseurService from '@/services/profService';

export default function Professeurs() {
  const [professeurs, setProfesseurs] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState("");

  // Charger tous les professeurs
  useEffect(() => {
    ProfesseurService.getAllProfesseurs()
      .then((data) => {
        setProfesseurs(data);
        console.log("Professeurs data:", data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Filtrage par nom et rôle
const filtered = professeurs.filter((prof) => {
  const matchName = prof.utilisateur.last_name
    .toLowerCase()
    .includes(search.toLowerCase());

  const matchRole = roleFilter ? prof.titre === roleFilter : true;

  return matchName && matchRole;
});

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-white to-blue-200 font-sans">
      <main className="flex-1 p-10">
        {/* Barre de filtres */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 ml-60 gap-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2"
          >
            <option value="">Titre</option>
            <option value="Docteur">Docteur</option>
            <option value="Professeur">Professeur</option>
            <option value="Assistant">Assistant</option>
          </select>

          <div className="flex items-center border rounded px-2 mr-60 py-1 w-[300px]  bg-white">
            <Search className="w-5 h-3 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Rechercher un professeur"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none bg-transparent flex-grow"
            />
          </div>
        </div>

        {/* Liste des professeurs */}
        <div className="space-y-6 flex flex-col items-center">
          {filtered.length === 0 && (
            <p className="text-gray-600 text-center">Aucun professeur trouvé.</p>
          )}

          {filtered.map((prof) => (
            <Link
              key={prof.id}
              href={`/nos-profs/${prof.id}`} 
              className="bg-white shadow-md rounded-lg p-4 flex items-center gap-10 hover:bg-blue-100 transition w-[900px]"
            >
              <Image
                src={prof.photo || '/default-avatar.png'}
                alt={`${prof.utilisateur.first_name} ${prof.utilisateur.last_name}`}
                width={60}
                height={60}
                className="rounded-full object-cover border"
              />
              <div>
                <h3 className="text-lg font-bold">
                  {prof.utilisateur.last_name} {prof.utilisateur.first_name}
                </h3>
                <p className="text-gray-600">{prof.titre}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
