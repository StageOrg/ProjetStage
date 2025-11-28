import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaSave, FaEdit, FaCamera, FaTimes } from "react-icons/fa";
import ProfesseurService from "@/services/profService";

export default function DonneesPersonnellesProf() {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    contact: "",
    sexe: "Masculin",
    titre: "",
    bio: "",
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState("/images/prof.png");
  const fileInputRef = useRef(null);

  // Charger les infos du professeur
  useEffect(() => {
    const fetchProf = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      try {
        const prof = await ProfesseurService.getProfesseurConnecte();
        console.log("Professeur connecté:", prof);
        setFormData((prev) => ({
        ...prev,
        nom: user.last_name || "",
        prenom: user.first_name || "",
        email: user.email || "",
        contact: user.telephone || "",
        titre: prof.titre || "",
        bio: prof.bio || "",
        photo: prof.photo || null,
      }));
      } catch (error) {
        console.error("Erreur récupération professeur:", error);
      }
    };

    fetchProf();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, photo: file }));
    }
  };

  const removePhoto = () => {
    //setPhotoPreview("/images/prof.png");
    setFormData((prev) => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
  console.log("Données envoyées :", Object.fromEntries(data));
  setEditMode(false);
      try {
      ProfesseurService.updateProfesseurConnecte({data});
    } catch (error) {
      console.error("Erreur mise à jour professeur:", error);
    }
  }; 
 

  const toggleEditMode = () => setEditMode(!editMode);

  return (
    <div className="bg-transparent max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-black">
          <FaUser /> Mes données personnelles
        </h2>

        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            editMode ? "bg-gray-200 text-gray-800" : "bg-blue-900 text-white"
          } hover:opacity-90 transition-opacity`}
        >
          {editMode ? <FaSave /> : <FaEdit />}
          {editMode ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* MODE EDITION */}
      {editMode ? (
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={handleSubmit}>
          {/* PHOTO */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={photoPreview}
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200"
              />
              {photoPreview !== "/images/prof.png" && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <label className="cursor-pointer bg-blue-100 text-blue-800 px-4 py-2 rounded-md flex gap-2">
              <FaCamera /> Changer la photo
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          {/* DONNÉES */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Champs utilisateurs */}
            {["nom", "prenom", "email", "contact", "sexe"].map((key) => (
              <div key={key}>
                <label className="block text-gray-600 text-sm mb-1 capitalize">
                  {key}
                </label>
                  <input
                    type="text"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  />
              </div>
            ))}

            {/* TITRE */}
            <div className="">
              <label className="block text-gray-600 text-sm mb-1">Titre</label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* BIOGRAPHIE */}
            <div className="sm:col-span-2">
              <label className="block text-gray-600 text-sm mb-1">Biographie</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-4">
              <button className="px-4 py-2 bg-gray-200 rounded-md" type="button" onClick={toggleEditMode}>
                Annuler
              </button>

              <button className="px-4 py-2 bg-orange-600 text-white rounded-md" type="submit">
                <FaSave /> Enregistrer
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* MODE VISUALISATION */
        <div className="flex flex-col md:flex-row gap-8">
          {/* PHOTO */}
          <img
            src={photoPreview}
            className="w-40 h-40 rounded-full object-cover border-4 border-blue-200"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
            {["nom", "prenom", "email", "contact"].map((key) => (
              <div key={key}>
                <div className="text-gray-500 capitalize">{key}</div>
                <div className="font-bold text-lg">{formData[key]}</div>
              </div>
            ))}

            {/* TITRE */}
            <div className="sm:col-span-2">
              <div className="text-gray-500">Titre</div>
              <div className="font-bold text-lg">{formData.titre || "—"}</div>
            </div>

            {/* BIOGRAPHIE */}
            <div className="sm:col-span-2">
              <div className="text-gray-500">Biographie</div>
              <div className="text-black whitespace-pre-line font-bold">{formData.bio || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
