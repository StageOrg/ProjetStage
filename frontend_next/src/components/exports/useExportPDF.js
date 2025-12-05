// src/components/exports/useExportPDF.js
'use client';
import { useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const useExportPDF = () => {
  const exportToPDF = useCallback((data = [], filename = 'export', options = {}) => {
    try {
      console.log('Génération PDF...');
      const {
        titre = 'LISTE DES ÉTUDIANTS',
        orientation = 'l',
        headerInfo = {},
        excludeColumns = [],
        logoPath = '/images/logo-epl.png',
        logoWidth = 50,
        signatureColumn = false,
        signatureWidth = 40,
        anneeAcademique = null,
      } = options;

      const doc = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 15;

      // ========== LOGO + ANNÉE ACADÉMIQUE ==========
      const logoHeight = 20; // Hauteur approximative du logo
      
      try {
        doc.addImage(logoPath, 'PNG', 14, y, logoWidth, logoHeight);
      } catch (e) {
        console.log('Logo non trouvé, on continue...');
      }

      // ✅ Année académique alignée avec le logo (à droite)
      if (anneeAcademique && anneeAcademique !== "Toutes les années académiques") {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 87, 128); // Couleur bleue institutionnelle
        doc.text(`Année académique : ${anneeAcademique}`, pageWidth - 14, y + 10, { align: 'right' });
      }

      y += logoHeight + 10; // Espace après le logo

      // ========== TITRE ==========
      doc.setTextColor(0, 0, 0); // Reset couleur
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(titre, pageWidth / 2, y, { align: 'center' });
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 50, y + 2, pageWidth / 2 + 50, y + 2);
      y += 15;

      // ========== EN-TÊTE INFO (si headerInfo fourni) ==========
      const hasHeaderInfo = Object.keys(headerInfo).length > 0;
      if (hasHeaderInfo) {
        doc.setDrawColor(41, 87, 128);
        doc.setLineWidth(0.3);
        const headerBoxHeight = 30;
        doc.rect(14, y, pageWidth - 28, headerBoxHeight);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        let headerY = y + 8;
        
        // Colonne Gauche
        if (headerInfo.filiere_nom) {
          doc.text('Filière :', 20, headerY);
          doc.setFont('helvetica', 'normal');
          doc.text(headerInfo.filiere_nom, 50, headerY);
          doc.setFont('helvetica', 'bold');
          headerY += 7;
        }
        if (headerInfo.parcours_nom) {
          doc.text('Parcours :', 20, headerY);
          doc.setFont('helvetica', 'normal');
          doc.text(headerInfo.parcours_nom, 50, headerY);
          doc.setFont('helvetica', 'bold');
          headerY += 7;
        }
        if (headerInfo.departement) {
          doc.text('Département :', 20, headerY);
          doc.setFont('helvetica', 'normal');
          doc.text(headerInfo.departement, 50, headerY);
        }
        
        // Colonne Droite
        headerY = y + 8;
        const rightColX = pageWidth / 2 + 10;
        if (headerInfo.annee_etude_libelle) {
          doc.setFont('helvetica', 'bold');
          doc.text('Année d\'étude :', rightColX, headerY);
          doc.setFont('helvetica', 'normal');
          doc.text(headerInfo.annee_etude_libelle, rightColX + 40, headerY);
          headerY += 7;
        }
        if (headerInfo.annee_academique_libelle) {
          doc.setFont('helvetica', 'bold');
          doc.text('Année académique :', rightColX, headerY);
          doc.setFont('helvetica', 'normal');
          doc.text(headerInfo.annee_academique_libelle, rightColX + 40, headerY);
        }
        y += headerBoxHeight + 10;
      }

      // ========== TABLEAU ==========
      if (data.length > 0) {
        const allHeaders = Object.keys(data[0]);
        let headers = allHeaders.filter(h => !excludeColumns.includes(h));
        if (signatureColumn) {
          headers.push('Signature');
        }
        const body = data.map(row => {
          const rowData = headers
            .filter(h => h !== 'Signature')
            .map(h => row[h] || '');
          if (signatureColumn) {
            rowData.push('');
          }
          return rowData;
        });
        const columnStyles = {};
        if (signatureColumn) {
          columnStyles[headers.length - 1] = { cellWidth: signatureWidth };
        }
        doc.autoTable({
          head: [headers],
          body: body,
          startY: y,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            halign: 'left',
            valign: 'middle',
          },
          headStyles: {
            fillColor: [41, 87, 128],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9
          },
          columnStyles: columnStyles,
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 10, left: 14, right: 14 },
          didDrawPage: function () {
            const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
            const totalPages = doc.internal.getNumberOfPages();
            const date = new Date().toLocaleDateString('fr-FR');
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Créé le ${date}`, 14, pageHeight - 10);
            doc.text(`Page ${pageNum}/${totalPages}`, pageWidth - 40, pageHeight - 10);
          }
        });
      } else {
        doc.setFontSize(12);
        doc.text('Aucun résultat à afficher', 14, y);
      }

      doc.save(`${filename}.pdf`);
      console.log('PDF téléchargé:', `${filename}.pdf`);
      return { success: true };
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return { exportToPDF };
};

export default useExportPDF;