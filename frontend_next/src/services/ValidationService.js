import api from '@/services/api';

export const checkEmail = async (email) => {
  if (!email) return { disponible: true };
  try {
    const res = await api.post('/auth/check_email/', { email });
    return res.data;
  } catch {
    return { erreur: "Erreur de vérification email" };
  }
};

export const checkNumCarte = async (num_carte) => {
  if (!num_carte) return { disponible: true };
  try {
    const res = await api.post('/utilisateurs/check-num-carte/', { num_carte });
    return res.data;
  } catch {
    return { erreur: "Erreur de vérification numéro de carte" };
  }
};