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
  // Export to Excel
  exportToExcel = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  };

  // Export to CSV
  exportToCSV = (data: any[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  // Export to JSON
  exportToJSON = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  };

  // Print report
  printReport = (elementId: string) => {
    const printContent = document.getElementById(elementId);
    if (!printContent) return;

    const originalTitle = document.title;
    document.title = 'Admin Report';
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Admin Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
              }
              @media print {
                button {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <div class="footer">
              Generated on: ${new Date().toLocaleString()}
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    document.title = originalTitle;
  };

  // Generate PDF (simple version using browser print)
  generatePDF = (elementId: string, filename: string) => {
    this.printReport(elementId);
  };
}

export default new ReportService();