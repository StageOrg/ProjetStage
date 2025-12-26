"use client";
import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaVenusMars, FaGraduationCap, FaInfoCircle } from "react-icons/fa";
import ProfesseurService from "@/services/profService";

export default function ProfilProfesseur({ profId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profData, setProfData] = useState({
    nom: "",
    prenom: "",
    email: "",
    contact: "",
    sexe: "",
    titre: "",
    bio: "",
    photo: null,
  });
  const [photoUrl, setPhotoUrl] = useState("/images/prof.png");

  // Charger les infos du professeur
  useEffect(() => {
    const fetchProf = async () => {
      setIsLoading(true);
      try {
      console.log("Fetching data for profId:", profId);
        const prof = await ProfesseurService.getProfesseurById(profId)
        
        console.log("Professeur récupéré:", prof);

        setProfData({
          nom: prof.utilisateur?.last_name || prof.nom || "",
          prenom: prof.utilisateur?.first_name || prof.prenom || "",
          email: prof.utilisateur?.email || prof.email || "",
          contact: prof.utilisateur?.telephone || prof.contact || "",
          sexe: prof.utilisateur?.sexe || prof.sexe || "",
          titre: prof.titre || "",
          bio: prof.bio || "",
          photo: prof.photo || null,
        });

        // Définir l'URL de la photo
        if (prof.photo) {
          if (prof.photo.startsWith('http')) {
            setPhotoUrl(prof.photo);
          } else {
            setPhotoUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${prof.photo}`);
          }
        } else {
          setPhotoUrl("/images/prof.png");
        }
      } catch (error) {
        console.error("Erreur récupération professeur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProf();
  }, [profId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto my-8 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Chargement du profil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-9xl mx-auto animate-fade-in p-8">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-blue-100">
        <FaUser className="text-blue-900 text-2xl" />
        <h2 className="text-2xl font-bold text-blue-900">
          Profil du Professeur
        </h2>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col md:flex-row gap-8 w-250">
        {/* Photo de profil */}
        <div className="flex flex-col items-center md:items-start">
       <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-blue-200 shadow-xl">
            <img
              src={photoUrl}
              alt={`Photo de ${profData.prenom} ${profData.nom}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/images/prof.png";
              }}
            />
          </div>
          
          {/* Badge titre si présent */}
          {profData.titre && (
            <div className="ml-8 mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-center font-semibold">
              {profData.titre}
            </div>
          )}
        </div>

        {/* Informations du professeur */}
        <div className="flex-grow space-y-6">
          {/* Nom complet */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <FaUser className="text-blue-600" />
              <span className="font-medium">Nom complet</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {profData.prenom} {profData.nom}
            </div>
          </div>

          {/* Grille d'informations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <FaEnvelope className="text-blue-600" />
                <span className="font-medium">Email</span>
              </div>
              <div className="text-gray-900 font-semibold break-all">
                {profData.email || "—"}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <FaPhone className="text-blue-600" />
                <span className="font-medium">Contact</span>
              </div>
              <div className="text-gray-900 font-semibold">
                {profData.contact || "—"}
              </div>
            </div>

            {/* Sexe */}
            {/* {profData.sexe && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <FaVenusMars className="text-blue-600" />
                  <span className="font-medium">Sexe</span>
                </div>
                <div className="text-gray-900 font-semibold">
                  {profData.sexe}
                </div>
              </div>
            )} */}

            {/* Titre académique */}
          {/*   {profData.titre && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <FaGraduationCap className="text-blue-600" />
                  <span className="font-medium">Titre </span>
                </div>
                <div className="text-gray-900 font-semibold">
                  {profData.titre}
                </div>
              </div>
            )} */}
          </div>

          {/* Biographie */}
          {profData.bio && (
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 p-6 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-3">
                <FaInfoCircle className="text-blue-600" />
                <span>Biographie</span>
              </div>
              <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                {profData.bio}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}