import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts (optional - for better appearance)
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhp.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Open Sans',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  companyInfo: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 5,
  },
  orderInfo: {
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    color: '#1F2937',
    marginBottom: 4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  colProduct: { width: '45%' },
  colQuantity: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 10,
    width: 100,
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export interface InvoiceOrderData {
  id: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

interface InvoicePDFProps {
  order: InvoiceOrderData;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal = order.totalAmount;
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>DOCTAMA FURNITURE</Text>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
          <Text style={styles.companyInfo}>
            123 Furniture Street, Manila, Philippines 1000{'\n'}
            Tel: (02) 1234-5678 | Email: info@doctama.com | Website: doctama.com
          </Text>
        </View>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>BILL TO</Text>
            <Text style={styles.infoValue}>{order.customerName || 'Customer'}</Text>
            <Text style={styles.infoValue}>{order.customerEmail}</Text>
            {order.customerPhone && <Text style={styles.infoValue}>{order.customerPhone}</Text>}
            <Text style={styles.infoValue}>{order.shippingAddress}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ORDER DETAILS</Text>
            <Text style={styles.infoValue}>Invoice #: INV-{order.orderNumber}</Text>
            <Text style={styles.infoValue}>Order #: {order.orderNumber}</Text>
            <Text style={styles.infoValue}>Date: {formatDate(order.orderDate)}</Text>
            <Text style={styles.infoValue}>Payment: {order.paymentMethod.toUpperCase()}</Text>
          </View>
        </View>

        {/* Status Badge (if delivered) */}
        {order.status === 'delivered' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>DELIVERED</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.colProduct]}>{item.productName}</Text>
              <Text style={[styles.colQuantity]}>{item.quantity}</Text>
              <Text style={[styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.colTotal]}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping:</Text>
            <Text style={styles.totalValue}>FREE</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (0%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={[styles.totalValue, { fontWeight: 'bold', color: '#DC2626' }]}>
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={{ marginTop: 20, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 4 }}>
          <Text style={styles.infoLabel}>PAYMENT INFORMATION</Text>
          <Text style={styles.infoValue}>Method: {order.paymentMethod.toUpperCase()}</Text>
          <Text style={styles.infoValue}>Status: {order.paymentStatus.toUpperCase()}</Text>
          {order.paymentStatus === 'paid' && (
            <Text style={[styles.infoValue, { color: '#10B981' }]}>✓ Payment received</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for shopping with Doctama Furniture!</Text>
          <Text>This is a computer-generated invoice. No signature required.</Text>
          <Text>For inquiries, please contact our customer support at support@doctama.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;