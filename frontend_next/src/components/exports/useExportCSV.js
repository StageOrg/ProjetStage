// src/components/exports/useExportCSV.js (Même structure)
import { useCallback } from 'react';

/**
 * Hook pour exporter en CSV
 */
export const useExportCSV = () => {
  const exportToCSV = useCallback((data, filename = 'export', headers = null) => {
    try {
      let csvContent = '';
      if (Array.isArray(data) && data.length > 0) {
        // Entêtes : custom ou auto
        const entetes = headers || Object.keys(data[0]);
        csvContent += entetes.join(',') + '\n';
        // Données : mappe avec les entêtes
        data.forEach(row => {
          const values = entetes.map(h => {
            const val = row[h];
            // Échapper les guillemets et virgules
            return typeof val === 'string' && (val.includes(',') || val.includes('\n'))
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          });
          csvContent += values.join(',') + '\n';
        });
      } else {
        csvContent = String(data);
      }

      // Créer un blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      return { success: true };
    } catch (error) {
      console.error('Erreur export CSV:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { exportToCSV };
};