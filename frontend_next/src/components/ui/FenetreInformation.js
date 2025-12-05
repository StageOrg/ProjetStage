import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle } from "lucide-react";
import api from "@/services/api";

export default function FenetreInformation({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState(null);
  const [message, setMessage] = useState('');
  const [shouldShow, setShouldShow] = useState(false);

  // Récupération de la période active
  useEffect(() => {
    if (!visible) return;
    
    const fetchPeriodeActive = async () => {
      setLoading(true);
      setShouldShow(false);
      
      try {
        const response = await api.get('/inscription/periode-inscription/');
        const periodes = response.data;
        const periodeActive = periodes.find(p => p.active) || periodes[0] || null;
        setPeriode(periodeActive);
        
        if (!periodeActive) {
          // Aucune période configurée → PAS de message
          setMessage("");
          setShouldShow(false);
        } else {
          const now = new Date();
          const debut = new Date(periodeActive.date_debut);
          const fin = new Date(periodeActive.date_fin);
          
          // Normaliser les dates (enlever les heures)
          now.setHours(0, 0, 0, 0);
          debut.setHours(0, 0, 0, 0);
          fin.setHours(0, 0, 0, 0);
          
          if (!periodeActive.active) {
            // Désactivé manuellement → PAS de message
            setMessage("");
            setShouldShow(false);
          } else if (now < debut) {
            // Programmé (futur) → Message affiché
            setMessage(`Les inscriptions commenceront le ${debut.toLocaleDateString('fr-FR')}`);
            setShouldShow(true);
          } else if (now > fin) {
            // Expiré (passé) → Message affiché
            setMessage(`La période d'inscription s'est terminée le ${fin.toLocaleDateString('fr-FR')}`);
            setShouldShow(true);
          } else {
            // Ouvert (actif + dans la période) → Message affiché
            setMessage(`Les inscriptions sont ouvertes jusqu'au ${fin.toLocaleDateString('fr-FR')}`);
            setShouldShow(true);
          }
        }
      } catch (error) {
        console.error("Erreur récupération période :", error);
        setMessage("");
        setShouldShow(false);
      }
      setLoading(false);
    };
    fetchPeriodeActive();
  }, [visible]);

  if (!visible || !shouldShow) return null;

  return (
    <AnimatePresence>
      {visible && shouldShow && (
        <motion.div
          className="fixed top-25 right-5 z-50 w-80 bg-white rounded-xl shadow-2xl p-5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          {/* Contenu */}
          <div className="text-sm text-gray-700">
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <div className="flex items-center gap-2">
                {message.includes("ouverte") ? (
                  <CheckCircle className="text-green-600" />
                ) : (
                  <AlertCircle className="text-red-600" />
                )}
                <span>{message}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}