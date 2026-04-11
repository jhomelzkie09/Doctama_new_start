import { pdf } from '@react-pdf/renderer';
import InvoicePDF from '../components/invoice/InvoicePDF';
import { saveAs } from 'file-saver';
import { InvoiceOrderData } from '../components/invoice/InvoicePDF';

class InvoiceService {
  async generateAndDownloadPDF(order: InvoiceOrderData): Promise<void> {
    try {
      // Generate PDF blob directly with JSX
      const blob = await pdf(<InvoicePDF order={order} />).toBlob();
      
      // Download file
      const fileName = `Invoice_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(blob, fileName);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  async openPrintWindow(order: InvoiceOrderData): Promise<void> {
    try {
      // Generate PDF blob and open in new window for printing
      const blob = await pdf(<InvoicePDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to print invoice:', error);
      throw error;
    }
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;