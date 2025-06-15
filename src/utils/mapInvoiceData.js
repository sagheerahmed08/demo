/**
 * Map data for EmailJS template and to match Invoice.jsx and your email template.
 */
export function mapInvoiceData({
  items,
  customerInfo,
  subtotal,
  tax,
  total,
  invoiceNumber,
  paymentMethod,
  paymentId,
  settings,
}) {
  return {
    shopName: settings.shopName || '',
    shopAddress: settings.address || '',
    shopPhone: settings.phone || '',
    shopEmail: settings.email || '',
    gstNo: settings.gstNo || '',
    invoiceNumber: invoiceNumber || '',
    date: new Date().toLocaleDateString(),
    customerName: customerInfo?.name || '',
    customerPhone: customerInfo?.phone || '',
    customerEmail: customerInfo?.email || '',
    items: items.map(item => ({
      name: item.name || '',
      reference_number: item.reference_number || '',
      quantity: item.quantity || 0,
      price: item.price != null ? Number(item.price).toFixed(2) : '0.00',
    })),
    currency: settings.currency?.symbol || '',
    subtotal: subtotal != null ? Number(subtotal).toFixed(2) : '0.00',
    discountPercent: settings.taxRate ? (settings.taxRate * 100).toFixed(0) : '0',
    discount: tax != null ? Number(tax).toFixed(2) : '0.00',
    total: total != null ? Number(total).toFixed(2) : (subtotal && tax ? (Number(subtotal) - Number(tax)).toFixed(2) : '0.00'),
    paymentMethod: paymentMethod || '',
    paymentId: paymentId || '',
    returnPolicy: settings.returnPolicy || '',
    to_email: customerInfo?.email || '',
    to_name: customerInfo?.name || '',
  };
}