"use client";

import React, { useState } from "react";
import authAPI from "@/services/authService";
import { Radio } from "lucide-react";


export default function RegisterForm() {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    utilisateur: {
      username: "",
      email: "",
      last_name: "",
      first_name: "",
      password: "",
      role: "",
    },
    num_carte: "",
    autre_prenom: "",
    date_naiss: "",
    lieu_naiss: "",
    titre: "",
    
  });

  //const handleRoleChange = (e) => setRole(e.target.value);
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setFormData((prev) => ({
      ...prev,
      utilisateur: { ...prev.utilisateur, role: e.target.value }
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("utilisateur.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        utilisateur: { ...prev.utilisateur, [field]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // On construit l'objet final tel que ton backend l'attend :
    const payload = {
      role: role,
      data: formData
    };
    const res = await authAPI.register(payload);

    alert("Compte créé avec succès !");
    console.log("Réponse backend :", res);

  } catch (error) {
    console.error("Erreur à l'inscription :", error.response?.data || error.message);
    alert("Erreur lors de l'inscription.");

  }
};


  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        Création d’un compte
      </h2>

      {/* Rôle */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">
          Rôle
        </label>
        <select
          value={role}
          onChange={handleRoleChange}
          required
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
        >
          <option value="">-- Choisir un rôle --</option>
          <option value="etudiant">Étudiant</option>
          <option value="professeur">professeur</option>
          <option value="secretaire">Secrétaire</option>
          <option value="resp_inscription">Responsable Inscription</option>
          <option value="resp_notes">Responsable Saisie Note</option>
          <option value="admin">Administrateur</option>
          <option value="gestionnaire">Gestionnaire</option>
          <option value="chef_dpt">Chef de Département</option>
        </select>
      </div>

      {/* Champs communs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="utilisateur.username"
          placeholder="Nom d'utilisateur"
          value={formData.utilisateur.username}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="email"
          name="utilisateur.email"
          placeholder="Email"
          value={formData.utilisateur.email}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="text"
          name="utilisateur.last_name"
          placeholder="Nom"
          value={formData.utilisateur.last_name}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="text"
          name="utilisateur.first_name"
          placeholder="Prénom"
          value={formData.utilisateur.first_name}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
        <input
          type="texte"
          name="utilisateur.sexe"
          placeholder="sexe"
          value={formData.utilisateur.sexe}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
         
        <input
          type="password"
          name="utilisateur.password"
          placeholder="Mot de passe"
          value={formData.utilisateur.password}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Champs spécifiques */}
      {role === "etudiant" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <input
            type="text"
            name="autre_prenom"
            placeholder="autres prénoms"
            value={formData.autre_prenom}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            
          />
          <input
            type="text"
            name="num_carte"
            placeholder="Matricule"
            value={formData.num_carte}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
           
          />
          <input
            type="date"
            name="date_naiss"
            placeholder="Date de naissance"
            value={formData.date_naiss}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="text"
            name="lieu_naiss"
            value={formData.lieu_naiss}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      )}

      {role === "professeur" && (
        <div>
          <input
            type="text"
            name="titre"
            placeholder="Titre"
            value={formData.titre}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
      )}

      {/* Bouton */}
      <div className="text-center">
        <button
       
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md transition"
        >
          S'inscrire
        </button>
      </div>
    </form>
  );
}
