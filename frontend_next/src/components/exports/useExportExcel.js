// src/components/exports/useExportExcel.js
import { useCallback } from 'react';
import * as XLSX from 'xlsx';

export const useExportExcel = () => {
  const exportToExcel = useCallback((data = [], filename = 'export', filters = {}) => {
    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    
    // Préparer les données avec les filtres en en-tête
    const worksheetData = [];
    
    // Ajouter les filtres appliqués
    if (filters.filiere_nom) worksheetData.push(['Filière :', filters.filiere_nom]);
    if (filters.parcours_nom) worksheetData.push(['Parcours :', filters.parcours_nom]);
    if (filters.annee_academique_libelle) worksheetData.push(['Année académique :', filters.annee_academique_libelle]);
    if (filters.annee_etude_libelle) worksheetData.push(['Année d\'étude :', filters.annee_etude_libelle]);
    if (filters.departement_nom) worksheetData.push(['Département :', filters.departement_nom]);
    
    // Ajouter une ligne vide si des filtres existent
    if (worksheetData.length > 0) {
      worksheetData.push([]);
    }
    
    // Ajouter les données principales
    if (data.length > 0) {
      // Ajouter les en-têtes
      const headers = Object.keys(data[0]);
      worksheetData.push(headers);
      
      // Ajouter les lignes de données
      data.forEach(row => {
        const rowData = headers.map(key => row[key] ?? '');
        worksheetData.push(rowData);
      });
    }
    
    // Créer la feuille de calcul
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Définir la largeur des colonnes (optionnel)
    const colWidths = worksheetData[0]?.map(() => ({ wch: 15 })) || [];
    ws['!cols'] = colWidths;
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    
    // Générer et télécharger le fichier
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, []);

  return { exportToExcel };
};