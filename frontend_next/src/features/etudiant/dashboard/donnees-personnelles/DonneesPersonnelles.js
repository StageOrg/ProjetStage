// frontend_next/src/features/etudiant/dashboard/donnees-personnelles/DonneesPersonnelles.js
"use client";
import React, { useState, useEffect } from "react";
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaVenusMars, FaGraduationCap, FaBook, 
  FaCalendarAlt, FaSpinner, FaEdit, FaSave, FaTimes,
  FaIdCard, FaCamera, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import etudiantDashboardService from "@/services/etudiants/etudiantDashboardService";

export default function DonneesPersonnelles() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [newPhotoFile, setNewPhotoFile] = useState(null); // NOUVEAU: Stocker le fichier séparément

  const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
  };

  const displayValue = (value, defaultText = "Non spécifié") => {
    return isEmpty(value) ? defaultText : value;
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await etudiantDashboardService.getMyCompleteData();
      console.log('Données étudiant reçues:', response);
      setStudentData(response);
      setFormData({
        email: response.email || '',
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        telephone: response.telephone || '',
        autre_prenom: response.autre_prenom || '',
        num_carte: response.num_carte || ''
      });
      
      // CORRECTION: Initialiser la photo correctement
      if (response.photo) {
        // Si l'URL est relative, ajouter le domaine de base
        const photoUrl = response.photo.startsWith('http') 
          ? response.photo 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${response.photo}`;
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
      setNewPhotoFile(null); // Réinitialiser le nouveau fichier
    } catch (err) {
      console.error('Erreur récupération données:', err);
      setError("Erreur lors du chargement de vos données personnelles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'num_carte') {
      const numeriqueValue = value.replace(/\D/g, '');
      const truncatedValue = numeriqueValue.slice(0, 6);
      
      if (value && value !== truncatedValue) {
        setError("Le numéro de carte doit contenir exactement 6 chiffres");
      } else {
        setError(null);
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: truncatedValue
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type et la taille
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      setError('L\'image ne doit pas dépasser 5MB');
      return;
    }

    // CORRECTION: Stocker le fichier séparément
    setNewPhotoFile(file);
    setError(null);

    // Créer l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // VALIDATION: Vérifier les champs requis
      const champsRequis = ['email', 'first_name', 'last_name', 'telephone'];
      const champsVides = champsRequis.filter(champ => !formData[champ]?.trim());
      
      if (champsVides.length > 0) {
        setError("Veuillez remplir tous les champs obligatoires (nom, prénom, email, téléphone)");
        setSaving(false);
        return;
      }
      
      const dataToSend = new FormData();
      
      // Ajouter les champs texte obligatoires (ne peuvent pas être vides)
      const champsObligatoires = ['email', 'first_name', 'last_name', 'telephone'];
      champsObligatoires.forEach(key => {
        const value = formData[key]?.trim();
        if (value) {
          dataToSend.append(key, value);
        } else {
          // Si vide, garder la valeur originale
          dataToSend.append(key, studentData[key] || '');
        }
      });
      
      // Ajouter les champs optionnels (peuvent être vides)
      const champsOptionnels = ['autre_prenom', 'num_carte'];
      champsOptionnels.forEach(key => {
        const value = formData[key]?.trim();
        if (value) {
          dataToSend.append(key, value);
        }
        // Si vide, on ne l'ajoute pas (sera vidé côté serveur)
      });
      
      // CORRECTION: Gérer la photo uniquement si un nouveau fichier a été sélectionné
      if (newPhotoFile) {
        dataToSend.append('photo', newPhotoFile);
        console.log('Nouvelle photo ajoutée au FormData');
      }
      
      // Log pour déboguer
      console.log('Données envoyées:', {
        ...Object.fromEntries(dataToSend),
        hasPhoto: !!newPhotoFile
      });
      
      const updatedData = await etudiantDashboardService.updateMyData(dataToSend);
      console.log('Données mises à jour reçues:', updatedData);
      
      // CORRECTION: Mettre à jour correctement les données et la photo
      setStudentData(updatedData);
      setFormData({
        email: updatedData.email || '',
        first_name: updatedData.first_name || '',
        last_name: updatedData.last_name || '',
        telephone: updatedData.telephone || '',
        autre_prenom: updatedData.autre_prenom || '',
        num_carte: updatedData.num_carte || ''
      });
      
      // Mettre à jour l'aperçu de la photo avec l'URL retournée par le serveur
      if (updatedData.photo) {
        const photoUrl = updatedData.photo.startsWith('http') 
          ? updatedData.photo 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${updatedData.photo}`;
        setPhotoPreview(photoUrl);
      }
      
      setNewPhotoFile(null); // Réinitialiser le nouveau fichier
      setIsEditing(false);
      
      alert('Informations mises à jour avec succès !');
      
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      if (err.response?.data) {
        console.error('Détails erreur:', err.response.data);
      }
      setError("Erreur lors de la mise à jour de vos informations");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      email: studentData.email || '',
      first_name: studentData.first_name || '',
      last_name: studentData.last_name || '',
      telephone: studentData.telephone || '',
      autre_prenom: studentData.autre_prenom || '',
      num_carte: studentData.num_carte || ''
    });
    
    // CORRECTION: Restaurer la photo originale
    if (studentData.photo) {
      const photoUrl = studentData.photo.startsWith('http') 
        ? studentData.photo 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${studentData.photo}`;
      setPhotoPreview(photoUrl);
    } else {
      setPhotoPreview(null);
    }
    
    setNewPhotoFile(null);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Chargement de vos données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent backdrop-blur-2xl shadow-1xl px-10 py-12 w-full animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="flex items-center gap-3 text-3xl font-extrabold text-blue-900 drop-shadow">
          <FaUser className="text-blue-700 text-3xl" /> 
          Mes données personnelles
        </h2>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FaEdit className="text-lg" /> Modifier
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaSave /> Enregistrer
                </>
              )}
            </button>
            <button 
              onClick={cancelEdit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <FaTimes /> Annuler
            </button>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <FaTimesCircle />
          {error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Photo de profil */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden border-4 border-white shadow-2xl group">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Photo de profil" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                onError={(e) => {
                  console.error('Erreur chargement image:', photoPreview);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                <FaUser className="text-blue-400 text-6xl" />
              </div>
            )}
            
            {/* Overlay pour modification photo */}
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label htmlFor="photo-upload" className="cursor-pointer text-white">
                  <FaCamera className="text-2xl" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              {studentData?.is_validated ? (
                <>
                  <span className="text-green-600 font-medium">photo de profil</span>
                </>
              ) : (
                <>
                  <span className="text-orange-600 font-medium">Photo de profil</span>
                </>
              )}
            </div>
            {isEditing && newPhotoFile && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Nouvelle photo sélectionnée
              </p>
            )}
          </div>
        </div>
                
                {/* Informations personnelles */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Champs modifiables */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2">
              Informations personnelles 
            </h3>
            
            {/* Nom */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaUser className="text-blue-600" />
                Nom de famille
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Votre nom de famille"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                  {displayValue(studentData?.last_name)}
                </div>
              )}
            </div>
            
            {/* Prénom */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaUser className="text-blue-600" />
                Prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Votre prénom"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                  {displayValue(studentData?.first_name)}
                </div>
              )}
            </div>

            {/* Autre prénom */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaUser className="text-blue-600" />
                Autre prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="autre_prenom"
                  value={formData.autre_prenom || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="Autre prénom (optionnel)"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                  {displayValue(studentData?.autre_prenom)}
                </div>
              )}
            </div>
            
            {/* Email */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaEnvelope className="text-blue-600" />
                Adresse email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="votre.email@exemple.com"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                  {displayValue(studentData?.email)}
                </div>
              )}
            </div>
            
            {/* Téléphone */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaPhone className="text-blue-600" />
                Numéro de téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder="+XXX XX XX XX XX"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                  {displayValue(studentData?.telephone)}
                </div>
              )}
            </div>

            {/* Sexe */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaVenusMars className="text-blue-600" />
                Sexe
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                {displayValue(studentData?.sexe)}
              </div>
            </div>
          </div>
          
          {/* Informations en lecture seule */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
              Informations scolaires
            </h3>
            
            {/* Numéro de carte */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaIdCard className="text-gray-500" />
                Numéro de carte étudiant
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="num_carte"
                    value={formData.num_carte || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Numéro de carte (6 chiffres)"
                    maxLength={6}
                    pattern="\d{6}"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Le numéro de carte doit contenir exactement 6 chiffres
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl font-mono text-gray-800 border-l-4 border-blue-500">
                  {displayValue(studentData?.num_carte, "Non attribué")}
                </div>
              )}
            </div>

            {/* Date de naissance */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaCalendarAlt className="text-gray-500" />
                Date de naissance
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                {studentData?.date_naiss 
                  ? new Date(studentData.date_naiss).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) 
                  : "Non spécifiée"}
              </div>
            </div>

            {/* Lieu de naissance */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaMapMarkerAlt className="text-gray-500" />
                Lieu de naissance
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl font-medium text-gray-800">
                {displayValue(studentData?.lieu_naiss)}
              </div>
            </div>

            {/* Parcours */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaGraduationCap className="text-gray-500" />
                Parcours
              </label>
              <div className="px-4 py-3 bg-blue-50 rounded-xl font-medium text-blue-800 border-l-4 border-blue-500">
                {displayValue(studentData?.parcours_info)}
              </div>
            </div>
            
            {/* Filière */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaBook className="text-gray-500" />
                Filière
              </label>
              <div className="px-4 py-3 bg-green-50 rounded-xl font-medium text-green-800 border-l-4 border-green-500">
                {displayValue(studentData?.filiere_info)}
              </div>
            </div>
            
            {/* Année d'étude */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <FaGraduationCap className="text-gray-500" />
                Année d'étude
              </label>
              <div className="px-4 py-3 bg-purple-50 rounded-xl font-medium text-purple-800 border-l-4 border-purple-500">
                {displayValue(studentData?.annee_etude_info)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}