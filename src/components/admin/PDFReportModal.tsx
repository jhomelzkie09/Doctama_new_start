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
  summary
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-2xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-50">
              <FileText className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Preview report before printing/exporting</p>
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
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div id="report-print-content" className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Company Header */}
            <div className="p-6 border-b bg-gradient-to-r from-rose-50 to-amber-50 print:bg-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    <img 
                      src={logo} 
                      alt="Doctama's Logo" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  {/* Company Info */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Doctama's Marketing</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Gabao, Bacon, Sorsogon City, Sorsogon, Philippines
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>📞 +63 998 586 8888</span>
                      <span>✉️ support@doctama.com</span>
                      <span>🌐 www.doctama.com</span>
                    </div>
                  </div>
                </div>
                {/* Report Title and Date */}
                <div className="text-center md:text-right">
                  <div className="bg-rose-100 px-4 py-2 rounded-lg">
                    <p className="text-xs text-rose-600 font-medium uppercase tracking-wider">{title}</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">
                      {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Info Section */}
            <div className="p-6 border-b bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Report Period</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {period || 'All Time'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Generated On</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {reportDate}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Generated By</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    Administrator
                  </p>
                </div>
              </div>
              {summary && (
                <div className="mt-4 p-3 bg-rose-50 rounded-lg">
                  {summary}
                </div>
              )}
            </div>

            {/* Report Content */}
            <div className="p-6">
              {children}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 print:bg-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
                <p>Doctama's Marketing - Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</p>
                <p>Generated: {reportDate}</p>
              </div>
              <div className="mt-2 text-center text-xs text-gray-400">
                <p>This is a computer-generated document. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReportModal;