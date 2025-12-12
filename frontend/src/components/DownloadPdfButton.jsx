import React, { useRef } from 'react';

// Assumes html2pdf.js is loaded globally or installed. If installed, import:
// import html2pdf from 'html2pdf.js';

export default function DownloadPdfButton({
  getHtml, // async function returning HTML string to render
  filename = 'document.pdf',
  marginTop = 10,
  marginBottom = 10,
  pageFormat = 'a4',
  pageOrientation = 'portrait',
  children,
  className = 'gap-2 bg-emerald-600 hover:bg-emerald-700 text-white',
}) {
  const containerRef = useRef(null);

  const handleDownload = async () => {
    const html = (await getHtml()) || '';
    if (!html) return;
    const container = containerRef.current;
    if (!container) return;
    // Wrap content in print-friendly container sized to page format
    const printable = document.createElement('div');
    printable.style.width = pageFormat === 'a4' ? '210mm' : '216mm'; // A4 or Letter width
    printable.style.boxSizing = 'border-box';
    printable.style.paddingTop = `${marginTop}mm`;
    printable.style.paddingBottom = `${marginBottom}mm`;
    printable.className = 'fr-view';
    printable.innerHTML = html;
    container.innerHTML = '';
    container.appendChild(printable);

    const opt = {
      margin: [0, 10, 0, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: pageFormat, orientation: pageOrientation },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    // Use global html2pdf if available
    const h2p = window.html2pdf || (await import('html2pdf.js')).default;
    await h2p().set(opt).from(container).save();
  };

  return (
    <>
      <button type="button" onClick={handleDownload} className={`inline-flex items-center px-3 py-2 rounded ${className}`}>
        {children || 'Télécharger PDF'}
      </button>
      {/* Hidden container to render HTML for pdf */}
      <div ref={containerRef} style={{ position: 'fixed', left: -9999, top: -9999, background: '#fff' }} />
    </>
  );
}
