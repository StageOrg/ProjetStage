// src/components/exports/useExportCSV.js
import { useCallback } from 'react';

export const useExportCSV = () => {
  const exportToCSV = useCallback((data = [], filename = 'export', filters = {}) => {
    let content = '';

    // Fonction locale bien déclarée
    const addLine = (label, value) => {
      if (value) content += `${label} : ${value}\n`;
    };

    addLine('Filière', filters.filiere_nom);
    addLine('Parcours', filters.parcours_nom);
    addLine('Année académique', filters.annee_academique_libelle);
    addLine('Année d\'étude', filters.annee_etude_libelle);
    addLine('Département', filters.departement_nom);
    if (content) content += '\n';

    // Tableau de données
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      content += headers.join(',') + '\n';

      data.forEach(row => {
        const line = headers.map(key => {
          const val = String(row[key] ?? '');
          return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
        });
        content += line.join(',') + '\n';
      });
    }

    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportToCSV };
};