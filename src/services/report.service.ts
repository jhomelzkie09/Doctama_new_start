import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface SaleReport {
  id: string;
  date: string;
  customer: string;
  total: number;
  status: string;
  items: number;
}

export interface OrderReport {
  id: string;
  orderDate: string;
  customer: string;
  total: number;
  status: string;
  paymentMethod: string;
}

export interface ProductReport {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
}

class ReportService {
  // ── Export to Excel ────────────────────────────────────────────────────────
  exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${filename}.xlsx`);
  };

  // ── Export to CSV ──────────────────────────────────────────────────────────
  exportToCSV = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  // ── Export to JSON ─────────────────────────────────────────────────────────
  exportToJSON = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  };

  // ── Print report ───────────────────────────────────────────────────────────
  /**
   * @param elementId  ID of the DOM element whose innerHTML is the report body
   * @param title      Report title shown in the header badge (e.g. "Sales Report")
   * @param logoSrc    Optional logo URL / base64 data URI — pass the imported logo asset
   */
  printReport = (elementId: string, title = 'Admin Report', logoSrc = '') => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const prev = document.title;
    document.title = title;

    const today = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const generated = new Date().toLocaleString('en-PH');

    const logoHTML = logoSrc
      ? `<img src="${logoSrc}" alt="Logo" style="width:48px;height:48px;object-fit:contain;" />`
      : '';

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }

            body {
              font-family: Arial, sans-serif;
              font-size: 13px;
              color: #111;
              padding: 28px;
            }

            /* ── Company header ── */
            .doc-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 16px;
              border-bottom: 2px solid #e5e7eb;
              margin-bottom: 16px;
            }

            .doc-header-left {
              display: flex;
              align-items: center;
              gap: 14px;
            }

            .logo-box {
              width: 56px;
              height: 56px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              flex-shrink: 0;
              background: #fff;
            }

            .company-name {
              font-size: 17px;
              font-weight: 700;
              color: #111827;
            }

            .company-address {
              font-size: 11px;
              color: #6b7280;
              margin-top: 3px;
            }

            .company-contacts {
              font-size: 11px;
              color: #6b7280;
              margin-top: 5px;
              display: flex;
              gap: 14px;
              flex-wrap: wrap;
            }

            .report-badge {
              background: #fff1f2;
              border: 1px solid #fecdd3;
              border-radius: 8px;
              padding: 9px 16px;
              text-align: right;
            }

            .report-badge-label {
              font-size: 10px;
              font-weight: 700;
              color: #e11d48;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }

            .report-badge-date {
              font-size: 12px;
              font-weight: 700;
              color: #1f2937;
              margin-top: 3px;
            }

            /* ── Meta row ── */
            .doc-meta {
              display: flex;
              gap: 10px;
              margin-bottom: 16px;
            }

            .doc-meta-cell {
              flex: 1;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 7px 10px;
            }

            .doc-meta-label {
              font-size: 10px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .doc-meta-value {
              font-size: 12px;
              font-weight: 600;
              color: #1f2937;
              margin-top: 2px;
            }

            /* ── Table ── */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 4px;
            }

            thead tr { background: #f3f4f6; }

            th {
              padding: 8px 10px;
              text-align: left;
              font-size: 10px;
              font-weight: 700;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              border-bottom: 1px solid #e5e7eb;
            }

            td {
              padding: 8px 10px;
              border-bottom: 1px solid #f3f4f6;
              color: #374151;
            }

            tfoot td {
              background: #f9fafb;
              font-weight: 600;
              border-top: 1px solid #e5e7eb;
            }

            /* ── Footer ── */
            .doc-footer {
              margin-top: 24px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #9ca3af;
            }

            .doc-footer-note {
              text-align: center;
              font-size: 10px;
              color: #d1d5db;
              margin-top: 5px;
            }

            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>

          <!-- Company header -->
          <div class="doc-header">
            <div class="doc-header-left">
              <div class="logo-box">${logoHTML}</div>
              <div>
                <div class="company-name">Doctama's Marketing</div>
                <div class="company-address">Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</div>
                <div class="company-contacts">
                  <span>&#128222; +63 998 586 8888</span>
                  <span>&#9993; support@doctama.com</span>
                  <span>&#127760; www.doctamasmarketing.com</span>
                </div>
              </div>
            </div>
            <div class="report-badge">
              <div class="report-badge-label">${title}</div>
              <div class="report-badge-date">${today}</div>
            </div>
          </div>

          <!-- Meta row -->
          <div class="doc-meta">
            <div class="doc-meta-cell">
              <div class="doc-meta-label">Generated on</div>
              <div class="doc-meta-value">${generated}</div>
            </div>
            <div class="doc-meta-cell">
              <div class="doc-meta-label">Generated by</div>
              <div class="doc-meta-value">Administrator</div>
            </div>
          </div>

          <!-- Report body -->
          ${printContent.innerHTML}

          <!-- Footer -->
          <div class="doc-footer">
            <span>Doctama's Marketing &middot; Gabao, Bacon, Sorsogon City, Sorsogon, Philippines</span>
            <span>Generated: ${generated}</span>
          </div>
          <div class="doc-footer-note">This is a computer-generated document. No signature required.</div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          <\/script>
        </body>
      </html>
    `);

    win.document.close();
    document.title = prev;
  };

  // ── Generate PDF (uses printReport under the hood) ─────────────────────────
  generatePDF = (elementId: string, filename: string, title = 'Admin Report', logoSrc = '') => {
    this.printReport(elementId, title, logoSrc);
  };
}

export default new ReportService();