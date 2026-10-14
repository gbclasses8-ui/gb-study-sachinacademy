import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Maximize, Minimize, ExternalLink } from 'lucide-react';

interface PdfViewerModalProps {
  pdfUrl: string | null;
  title: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  pdfUrl,
  title,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stream through our backend proxy which returns Content-Type: application/pdf; Content-Disposition: inline
  const inAppPdfUrl = pdfUrl ? `/pdf?url=${encodeURIComponent(pdfUrl)}` : '';

  // Auto-clear loading spinner so it never gets permanently stuck on PDF load
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [pdfUrl]);

  if (!pdfUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = inAppPdfUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="In-App Notes & PDF Reader"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-1 sm:p-4"
    >
      <div 
        className={`relative w-full ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-5xl h-[92vh] rounded-2xl'
        } bg-[#121214] border border-zinc-800 flex flex-col shadow-2xl overflow-hidden transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/20">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                {title}
              </h2>
              <p className="text-[11px] text-pink-400 font-medium">GB STUDY Notes Reader</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab Button (100% reliable across all browsers & phones) */}
            <a
              href={inAppPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Open PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Tab</span>
            </a>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Download Notes PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewport */}
        <div className="relative flex-1 w-full bg-[#1e1e24] overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 z-10 pointer-events-none transition-opacity duration-300">
              <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-zinc-400">Loading notes from GB STUDY...</p>
            </div>
          )}

          <object
            data={inAppPdfUrl}
            type="application/pdf"
            className="w-full flex-1 min-h-0 bg-zinc-900"
            onLoad={() => setLoading(false)}
          >
            <iframe
              src={inAppPdfUrl}
              title={title}
              onLoad={() => setLoading(false)}
              className="w-full h-full border-0 bg-zinc-900"
            />
          </object>

          {/* Quick link bar for phones / browsers without embedded PDF support */}
          <div className="p-2 sm:p-2.5 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 px-4 shrink-0">
            <span className="truncate text-[11px] sm:text-xs">If PDF preview does not show on your device:</span>
            <a
              href={inAppPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 font-bold underline shrink-0 ml-2 flex items-center gap-1 text-[11px] sm:text-xs"
            >
              <span>Tap to Open / Download PDF</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
