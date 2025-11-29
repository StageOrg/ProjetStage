// stores/globalStore.js
import { create } from 'zustand';

const useGlobalStore = create((set) => ({
  // UE + infos pédagogiques (nouveau ou ancien étudiant)
  uesDisponibles: null,
  uesInfos: null, // { parcours_id, filiere_id, annee_etude_id, libellés... }
  typeEtudiant: null, // "nouveau" | "ancien"

  // Données ancien étudiant (réinscription)
  ancienEtudiantData: null,

  // Actions
  setInscriptionData: (ues, infos, type = "nouveau", ancienData = null) =>
    set({
      uesDisponibles: ues,
      uesInfos: infos,
      typeEtudiant: type,
      ancienEtudiantData: ancienData || null,
    }),

  clearInscription: () =>
    set({
      uesDisponibles: null,
      uesInfos: null,
      typeEtudiant: null,
      ancienEtudiantData: null,
    }),

  // Bonus : pour admin ou autres modules futurs
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useGlobalStore;