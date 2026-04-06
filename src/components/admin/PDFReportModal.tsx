import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import logo from '../../assets/logo.png';

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onPrint?: () => void;
  onExport?: () => void;
  reportDate?: string;
  period?: string;
  summary?: React.ReactNode;
}

const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onPrint,
  onExport,
  reportDate = new Date().toLocaleString(),
  period,
  summary,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* ── Modal toolbar (hidden when printing) ── */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-6 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-50">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Preview report before printing / exporting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Scrollable preview area ── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 print:p-0 print:bg-white print:overflow-visible">
          <div id="report-print-content" className="bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">

            {/* ── Company header ── */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-amber-50 print:bg-white print:border-b-2 print:border-gray-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Logo + company info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-white shadow-sm print:shadow-none print:border print:border-gray-200">
                    <img
                      src={logo}
                      alt="Doctama's Marketing Logo"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                      Doctama's Marketing
                    </h1>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      <span>📞 +63 998 586 8888</span>
                      <span>✉️ support@doctama.com</span>
                      <span>🌐 www.doctamasmarketing.com</span>
                    </div>
                  </div>
                </div>

                {/* Report title badge */}
                <div className="text-center md:text-right shrink-0">
                  <div className="inline-block bg-rose-100 px-5 py-3 rounded-lg">
                    <p className="text-xs text-rose-600 font-semibold uppercase tracking-wider">
                      {title}
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {new Date().toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Report meta info ── */}
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Report period</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {period || 'All time'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Generated on</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{reportDate}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Generated by</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">Administrator</p>
                </div>
              </div>

              {summary && (
                <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-100">
                  {summary}
                </div>
              )}
            </div>

            {/* ── Report content (table / charts passed as children) ── */}
            <div className="p-6">
              {children}
            </div>

            {/* ── Footer ── */}
            <div className="p-5 border-t border-gray-200 bg-gray-50 print:bg-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-1 text-xs text-gray-500">
                <p>Doctama's Marketing · Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</p>
                <p>Generated: {reportDate}</p>
              </div>
              <p className="mt-1.5 text-center text-xs text-gray-400">
                This is a computer-generated document. No signature required.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReportModal;