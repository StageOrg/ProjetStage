// src/components/exports/useExportExcel.js (Même structure)
import { useCallback } from 'react';

/**
 * Hook pour exporter en Excel (via CSV tabulé)
 */
export const useExportExcel = () => {
  const exportToExcel = useCallback((data, filename = 'export', headers = null) => {
    try {
      // Convertir les données en format CSV d'abord (tabulé pour Excel)
      let csvContent = '';
      if (Array.isArray(data) && data.length > 0) {
        // Entêtes : custom ou auto
        const entetes = headers || Object.keys(data[0]);
        csvContent += entetes.join('\t') + '\n';
        // Données : mappe avec les entêtes
        data.forEach(row => {
          const values = entetes.map(h => {
            const val = row[h];
            // Échapper les guillemets et virgules
            return typeof val === 'string' && (val.includes(',') || val.includes('\n'))
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          });
          csvContent += values.join('\t') + '\n';
        });
      } else {
        csvContent = String(data);
      }

      // Créer un blob avec type Excel
      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.xls`;
      link.click();
      URL.revokeObjectURL(link.href);
      return { success: true };
    } catch (error) {
      console.error('Erreur export Excel:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { exportToExcel };
};