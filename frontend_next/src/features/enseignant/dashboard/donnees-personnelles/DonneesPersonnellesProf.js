import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaSave, FaEdit, FaCamera, FaTimes } from "react-icons/fa";
import ProfesseurService from "@/services/profService";

export default function DonneesPersonnellesProf() {
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profId, setProfId] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    contact: "",
    sexe: "",
    titre: "",
    bio: "",
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState("/images/prof.png");
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  // Charger les infos du professeur
  useEffect(() => {
    const fetchProf = async () => {
      setIsLoading(true);
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setIsLoading(false);
        return;
      }
      const user = JSON.parse(storedUser);

      try {
        const prof = await ProfesseurService.getProfesseurConnecte();
        console.log("Professeur connecté:", prof);
        
        setFormData({
          nom: user.last_name || "",
          prenom: user.first_name || "",
          email: user.email || "",
          contact: user.telephone || "",
          sexe: user.sexe || "",
          titre: prof.titre || "",
          bio: prof.bio || "",
          photo: prof.photo || null,
        });

        // Définir l'aperçu de la photo
        if (prof.photo) {
          // Si la photo est une URL complète
          if (prof.photo.startsWith('http')) {
            setPhotoPreview(prof.photo);
          } else {
            // Si c'est un chemin relatif, construire l'URL complète
            // Adapter selon votre configuration backend
            setPhotoPreview(`http://localhost:8000/api/utilisateurs/professeur/${prof.photo}`);
          }
        } else {
          setPhotoPreview("/images/prof.png");
        }

        setProfId(prof.id);
      } catch (error) {
        console.error("Erreur récupération professeur:", error);
      } finally {
        setIsLoading(false);
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
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La photo ne doit pas dépasser 5MB");
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner une image valide");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      setNewPhotoFile(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview("/images/prof.png");
    setNewPhotoFile(null);
    setFormData((prev) => ({ ...prev, photo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formDataToSend = new FormData();

      // Ajouter les champs de texte
      formDataToSend.append("titre", formData.titre);
      formDataToSend.append("bio", formData.bio);

      // Ajouter la nouvelle photo si elle existe
      if (newPhotoFile) {
        formDataToSend.append("photo", newPhotoFile);
      }

      console.log("Données envoyées:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await ProfesseurService.updateProfesseurConnecte(formDataToSend);
      console.log("Réponse du serveur:", response);

      // Mettre à jour l'aperçu avec la nouvelle photo du serveur
      if (response.photo) {
        if (response.photo.startsWith('http')) {
          setPhotoPreview(response.photo);
        } else {
          setPhotoPreview(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${response.photo}`);
        }
      }

      setNewPhotoFile(null);
      setEditMode(false);
      alert("Profil mis à jour avec succès!");
    } catch (error) {
      console.error("Erreur mise à jour professeur:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      // Si on annule, réinitialiser la photo preview
      if (formData.photo) {
        if (formData.photo.startsWith('http')) {
          setPhotoPreview(formData.photo);
        } else {
          setPhotoPreview(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${formData.photo}`);
        }
      } else {
        setPhotoPreview("/images/prof.png");
      }
      setNewPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setEditMode(!editMode);
  };

  if (isLoading) {
    return (
      <div className="bg-transparent max-w-4xl mx-auto my-8 flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="bg-transparent max-w-4xl mx-auto my-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-black">
          <FaUser /> Mes données personnelles
        </h2>

        <button
          onClick={toggleEditMode}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            editMode ? "bg-gray-200 text-gray-800" : "bg-blue-900 text-white"
          } hover:opacity-90 transition-opacity disabled:opacity-50`}
        >
          {editMode ? <FaTimes /> : <FaEdit />}
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
                alt="Photo de profil"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-200"
                onError={(e) => {
                  e.target.src = "/images/prof.png";
                }}
              />
              {photoPreview !== "/images/prof.png" && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  title="Supprimer la photo"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            <label className="cursor-pointer bg-blue-100 text-blue-800 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-200 transition-colors">
              <FaCamera /> Changer la photo
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2 text-center">
              JPG, PNG (max 5MB)
            </p>
          </div>

          {/* DONNÉES */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Champs utilisateurs en lecture seule */}
            <div>
              <label className="block text-gray-600 text-sm mb-1">Nom</label>
              <input
                type="text"
                value={formData.nom}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Prénom</label>
              <input
                type="text"
                value={formData.prenom}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Contact</label>
              <input
                type="text"
                value={formData.contact}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Sexe</label>
              <input
                type="text"
                value={formData.sexe}
                disabled
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* TITRE - Modifiable */}
            <div>
              <label className="block text-gray-600 text-sm mb-1">Titre</label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                placeholder="Ex: Professeur, Dr., etc."
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* BIOGRAPHIE - Modifiable */}
            <div className="sm:col-span-2">
              <label className="block text-gray-600 text-sm mb-1">Biographie</label>
              <textarea
                name="bio"
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Parlez-nous de vous..."
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                type="button"
                onClick={toggleEditMode}
                disabled={isSaving}
              >
                Annuler
              </button>

              <button
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                type="submit"
                disabled={isSaving}
              >
                <FaSave />
                {isSaving ? "Enregistrement..." : "Enregistrer"}
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
            alt="Photo de profil"
            className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow-lg"
            onError={(e) => {
              e.target.src = "/images/prof.png";
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow">
            <div>
              <div className="text-gray-500 text-sm">Nom</div>
              <div className="font-bold text-lg">{formData.nom || "—"}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Prénom</div>
              <div className="font-bold text-lg">{formData.prenom || "—"}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Email</div>
              <div className="font-bold text-lg">{formData.email || "—"}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Contact</div>
              <div className="font-bold text-lg">{formData.contact || "—"}</div>
            </div>

            <div>
              <div className="text-gray-500 text-sm">Sexe</div>
              <div className="font-bold text-lg">{formData.sexe || "—"}</div>
            </div>

            {/* TITRE */}
            <div>
              <div className="text-gray-500 text-sm">Titre</div>
              <div className="font-bold text-lg">{formData.titre || "—"}</div>
            </div>

            {/* BIOGRAPHIE */}
            <div className="sm:col-span-2">
              <div className="text-gray-500 text-sm">Biographie</div>
              <div className="font-boldtext-black whitespace-pre-line">{formData.bio || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}