import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaSave, FaEdit, FaCamera, FaTimes } from "react-icons/fa";

export default function DonneesPersonnellesProf() {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("/images/prof.png");
  const fileInputRef = useRef(null);

  // Charger l'utilisateur depuis localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);

      setFormData({
        nom: user.last_name || "",
        prenom: user.first_name || "",
        email: user.email || "",
        contact: user.telephone || "",
        sexe: user.sexe || "Masculin",
        photo: null,
      });
    }
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
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
    }
  };

  const removePhoto = () => {
    setPhotoPreview("/images/prof.png");
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "photo" && value) {
        formDataToSend.append(key, value);
      }
    });
    if (formData.photo) {
      formDataToSend.append("photo", formData.photo);
    }

    // 👉 Ici tu appelles ton API pour sauvegarder
    console.log("Données à envoyer:", Object.fromEntries(formDataToSend));

    setEditMode(false);
  };

  const toggleEditMode = () => setEditMode(!editMode);

  if (!formData) {
    return <p className="text-center text-gray-500">Chargement...</p>;
  }

  return (
    <div className="bg-transparent max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-black">
          <FaUser className="text-black" /> Mes données personnelles
        </h2>
        <button
          onClick={toggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            editMode ? "bg-gray-200 text-gray-800" : "bg-orange-600 text-white"
          } hover:opacity-90 transition-opacity`}
        >
          {editMode ? <FaSave /> : <FaEdit />}
          {editMode ? "Annuler" : "Modifier"}
        </button>
      </div>

      {editMode ? (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Colonne photo */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative mb-4">
              <img
                src={photoPreview}
                alt="Photo de profil"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200"
              />
              {photoPreview !== "/images/prof.png" && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <label className="cursor-pointer bg-blue-100 text-blue-800 px-4 py-2 rounded-md hover:bg-blue-200 transition flex items-center gap-2">
              <FaCamera />
              Changer la photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
          </div>

          {/* Colonne données */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Object.entries(formData).map(([key, value]) => {
              if (key === "photo") return null;

              return (
                <div
                  key={key}
                  className={
                    key === "adresse" || key === "specialite" ? "sm:col-span-2" : ""
                  }
                >
                  <label className="block text-gray-600 text-sm mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  {key === "sexe" ? (
                    <select
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Masculin">M</option>
                      <option value="Féminin">F</option>
                    </select>
                  ) : (
                    <input
                      type={
                        key === "email"
                          ? "email"
                          : key === "contact"
                          ? "tel"
                          : "text"
                      }
                      name={key}
                      value={value}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              );
            })}

            <div className="sm:col-span-2 flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={toggleEditMode}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition flex items-center gap-2"
              >
                <FaSave /> Enregistrer
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo en mode visualisation */}
          <div className="flex justify-center md:justify-start">
            <img
              src={photoPreview}
              alt="Photo de profil"
              className="w-40 h-40 rounded-full object-cover border-4 border-blue-200"
            />
          </div>

          {/* Données en mode visualisation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
            {Object.entries(formData).map(([key, value]) => {
              if (key === "photo") return null;

              return (
                <div
                  key={key}
                  className={
                    key === "adresse" || key === "specialite" ? "sm:col-span-2" : ""}
                >
                  <div className="text-gray-500 text-sm capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="font-bold text-lg text-black">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
