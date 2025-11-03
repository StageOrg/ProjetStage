// src/components/exports/useExportPDF.js (Assure-toi que ce fichier existe et a ce contenu exact)
import { useCallback } from 'react';

/**
 * Hook pour exporter en PDF
 */
export const useExportPDF = () => {
  const exportToPDF = useCallback(async (data, filename = 'export', headers = null) => {
    try {
      // Utilise jsPDF pour générer le PDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      // Configuration de base
      doc.setFontSize(12);
      let yPosition = 20;

      // Si c'est un tableau d'objets
      if (Array.isArray(data) && data.length > 0) {
        // Entêtes : custom ou auto
        const entetes = headers || Object.keys(data[0]);
        doc.setFont(undefined, 'bold');
        doc.text(entetes.join(' | '), 10, yPosition);
        yPosition += 10;

        // Données : mappe avec les entêtes
        doc.setFont(undefined, 'normal');
        data.forEach((row) => {
          const values = entetes.map(h => String(row[h] || ''));
          doc.text(values.join(' | '), 10, yPosition);
          yPosition += 8;
          // Nouvelle page si nécessaire
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
        });
      } else {
        // Si c'est du texte simple
        doc.text(String(data), 10, yPosition);
      }

      doc.save(`${filename}.pdf`);
      return { success: true };
    } catch (error) {
      console.error('Erreur export PDF:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { exportToPDF };
};