// patterns de validation
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email standard
  telephone: /^(\+228)?(70|71|72|76|79|90|91|92|93|96|97|98|99)\d{6}$/,   
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, // Min 8 chars, 1 maj, 1 min, 1 chiffre, 1 spécial
  numeroCarte: /^[0-9]{6}$/, // Exactement 6 chiffres
  nomPrenom: /^[a-zA-ZÀ-ÿ\s\-']+$/, // Lettres, espaces, traits d'union, apostrophes
  lieuNaissance: /^[a-zA-ZÀ-ÿ\s\-,']+$/, // Lettres, espaces, virgules, traits d'union
};

// Messages d'erreur
export const errorMessages = {
  email: "Format d'email invalide",
  telephone: "Format de téléphone invalide (ex: +22891020304)",
  password: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial",
  numeroCarte: "Le numéro de carte doit contenir exactement 6 chiffres",
  nomPrenom: "Ne doit contenir que des lettres, espaces, traits d'union et apostrophes",
  lieuNaissance: "Ne doit contenir que des lettres, espaces, virgules et traits d'union",
  required: "Ce champ est requis",
  dateNaissance: "Vous devez avoir au moins 15 ans pour vous inscrire",
  photo: "La photo ne doit pas dépasser 2Mo",
  photoFormat: "Seuls les formats JPG et PNG sont acceptés",
  sexe: "Sexe invalide (M ou F requis)",
};

// Fonctions utilitaires pour la validation de date
export const calculerDateMinimale = () => {
  const aujourdHui = new Date();
  const anneeMinimale = aujourdHui.getFullYear() - 15;
  return new Date(anneeMinimale, aujourdHui.getMonth(), aujourdHui.getDate()).toISOString().split('T')[0];
};

export const validerAge = (dateNaissance) => {
  if (!dateNaissance) return false;
  
  const dateNaiss = new Date(dateNaissance);
  const aujourdHui = new Date();
  const ageMinimum = new Date(
    aujourdHui.getFullYear() - 15,
    aujourdHui.getMonth(),
    aujourdHui.getDate()
  );
  return dateNaiss <= ageMinimum;
};

// Validation de photo simplifiée
export const validerPhoto = (fichier) => {
  if (!fichier) return null;
  
  // Validation de la taille (max 2Mo)
  if (fichier.size > 2 * 1024 * 1024) {
    return errorMessages.photo;
  }

  // Validation du type (JPG/PNG)
  if (!['image/jpeg', 'image/png'].includes(fichier.type)) {
    return errorMessages.photoFormat;
  }

  return null;
};

// Fonctions de validation
export const validateField = (fieldName, value, isRequired = true) => {

  // Gère les types : string, number (int backend), null/undefined, File (photo)
  let trimmedValue;
  if (typeof value === 'string') {
    trimmedValue = value.trim();
  } else if (typeof value === 'number') {
    if (isRequired && (value === null || value === undefined || isNaN(value) || value <= 0)) {
      return errorMessages.required;
    }
    if (value <= 0) return null;  // Optionnel vide
    trimmedValue = String(value);  // Pour regex seulement
  } else if (value === null || value === undefined) {
    if (isRequired) return errorMessages.required;
    return null;
  } else {
    if (isRequired) return errorMessages.required;
    return null;
  }

  // Si optionnel et vide : OK
  if (!isRequired && (!trimmedValue || trimmedValue === '')) return null;

  switch (fieldName) {
    case 'email':
      return !validationPatterns.email.test(trimmedValue) ? errorMessages.email : null;
    
    case 'telephone':
    case 'contact':
      return !validationPatterns.telephone.test(trimmedValue) ? errorMessages.telephone : null;
    
    case 'password':
      return !validationPatterns.password.test(trimmedValue) ? errorMessages.password : null;
    
    case 'numero_carte':
    case 'num_carte': 
      return !validationPatterns.numeroCarte.test(trimmedValue) ? errorMessages.numeroCarte : null;
    
    case 'nom':
    case 'prenom':
    case 'autre_prenom':
    case 'last_name':  
    case 'first_name':
      return !validationPatterns.nomPrenom.test(trimmedValue) ? errorMessages.nomPrenom : null;
    
    case 'lieu_naiss':
      return !validationPatterns.lieuNaissance.test(trimmedValue) ? errorMessages.lieuNaissance : null;
    
    case 'date_naissance':
    case 'date_naiss':  // Alias
      return !validerAge(trimmedValue) ? errorMessages.dateNaissance : null;
    
    case 'sexe':  
      return !['M', 'F'].includes(trimmedValue.toUpperCase()) ? errorMessages.sexe : null;
    
    default:
      return null;
  }
};

// Validation complète de formulaire
export const validateForm = (formData, fieldsConfig) => {
  const errors = {};
  
  Object.keys(fieldsConfig).forEach(fieldName => {
    const config = fieldsConfig[fieldName];
    const error = validateField(
      fieldName, 
      formData[fieldName], 
      config.required
    );
    
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};