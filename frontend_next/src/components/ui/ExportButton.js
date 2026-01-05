// src/components/ui/ExportButton.js (Version corrigée)
import React, { useState } from 'react';
import { Download, FileText, Sheet, File } from 'lucide-react';
import { useExportPDF } from '@/components/exports/useExportPDF';
import { useExportCSV } from '@/components/exports/useExportCSV';
import { useExportExcel } from '@/components/exports/useExportExcel';

/**
 * Composant bouton d'export avec dropdown
 * @param {Array} data - Données à exporter
 * @param {String} filename - Nom du fichier (sans extension)
 * @param {Object} options - Options d'export (pour PDF: titre, headerInfo, etc.)
 * @param {Object} filters - Filtres appliqués (pour CSV/Excel)
 */
const ExportButton = ({
  data,
  filename = 'export',
  options = {}, 
  filters = {}, 
  onExportStart,
  onExportEnd,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { exportToPDF } = useExportPDF();
  const { exportToCSV } = useExportCSV();
  const { exportToExcel } = useExportExcel();

  const handleExport = async (type) => {
    // Validation externe personnalisée
    if (options.validation) {
      const error = options.validation();
      if (error) {
        try {
            
            alert(error); 
        } catch(e) {}
        return;
      }
    }

    if (isExporting || !data || data.length === 0) {
      alert('Aucune donnée à exporter.');
      return;
    }

    setIsExporting(true);
    onExportStart?.(type);

    let result = { success: false, error: 'Export échoué' };

    try {
      switch (type) {
        case 'pdf':
          result = await exportToPDF(data, filename, options);
          break;
        case 'excel':
          result = exportToExcel(data, filename, filters, options);
          break;
        case 'csv':
          result = exportToCSV(data, filename, filters);
          break;
        default:
          result = { success: false, error: 'Type d\'export inconnu' };
      }
    } catch (error) {
      console.error(`Erreur export ${type}:`, error);
      result = { success: false, error: error.message || 'Erreur inconnue' };
    } finally {
      setIsExporting(false);
      setIsOpen(false);
      onExportEnd?.(type, result);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
        title={disabled ? 'Aucune donnée à exporter' : 'Exporter les données'}
      >
        <Download className="w-5 h-5" />
        <span>{isExporting ? 'Export en cours...' : 'Exporter'}</span>
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-20">
            <button 
              onClick={() => handleExport('pdf')} 
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              disabled={disabled || isExporting}
            >
              <FileText className="w-5 h-5 text-red-600" />
              <span className="text-gray-700 font-medium">PDF</span>
            </button>

            <button 
              onClick={() => handleExport('excel')} 
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
              disabled={disabled || isExporting}
            >
              <Sheet className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">Excel</span>
            </button>

            <button 
              onClick={() => handleExport('csv')} 
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
              disabled={disabled || isExporting}
            >
              <File className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">CSV</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;