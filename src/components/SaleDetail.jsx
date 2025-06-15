
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Edit, User, Phone, Mail, ShoppingCart, Hash, Calendar, CreditCard } from 'lucide-react';
import Invoice from '@/components/Invoice';
import { useReactToPrint } from 'react-to-print';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import { Button } from '@/components/ui/button';

const SaleDetail = () => {
  const { invoiceNumber } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useShopSettings();
  const navigate = useNavigate();
  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  useEffect(() => {
    const fetchSale = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sales')
          .select(`
            *,
            customer:customers (*),
            sale_items (
              *,
              product:products (name, reference_number)
            )
          `)
          .eq('invoice_number', invoiceNumber)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { 
            toast({ title: 'Not Found', description: `Sale with invoice ${invoiceNumber} not found.`, variant: 'destructive' });
            setSale(null);
          } else {
            throw error;
          }
        } else {
          setSale(data);
        }
      } catch (error) {
        console.error('Error fetching sale details:', error);
        toast({ title: 'Error', description: 'Could not fetch sale data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceNumber) {
      fetchSale();
    }
  }, [invoiceNumber, toast]);

  if (loading) {
    return <div className="text-center py-10">Loading sale details...</div>;
  }

  if (!sale) {
    return (
      <div className="text-center py-10">
        <p>Sale not found.</p>
        <Link to="/billing" className="text-primary hover:underline mt-4 inline-block">Go to Billing</Link>
      </div>
    );
  }

  const invoiceDataForPrint = {
    customerInfo: { 
      name: sale.customer?.name || sale.customer_name, 
      phone: sale.customer?.phone || sale.customer_phone,
      email: sale.customer?.email || sale.customer_email,
    },
    items: sale.sale_items.map(item => ({
      id: item.product?.id,
      name: item.product?.name || 'N/A',
      reference_number: item.product?.reference_number || 'N/A',
      price: item.unit_price,
      quantity: item.quantity,
      size: item.size,
    })),
    subtotal: sale.total_amount + sale.tax_amount,
    tax: sale.tax_amount,
    total: sale.total_amount,
    invoiceNumber: sale.invoice_number,
    date: new Date(sale.created_at).toLocaleString(),
    paymentMethod: sale.payment_method,
    paymentId: sale.payment_id,
  };

  const neumorphismClass = settings.darkMode ? 'neumorphism-dark' : 'neumorphism';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <Link to={sale.customer_id ? `/customers/${sale.customer_id}` : "/customers"} className="flex items-center text-primary hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/sales/edit/${sale.id}`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Sale
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
        </div>
      </div>

      <div className={`${neumorphismClass} rounded-xl p-8`}>
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h1 className="text-3xl font-bold">Invoice <span className="text-primary">{sale.invoice_number}</span></h1>
            <p className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Issued on: {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
            </p>
          </div>
          <div className={`mt-4 sm:mt-0 text-sm text-right px-3 py-1.5 rounded-md font-medium
            ${sale.payment_method === 'RAZORPAY' ? (settings.darkMode ? 'bg-green-700 text-green-100' : 'bg-green-100 text-green-700') 
            : (settings.darkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-100 text-blue-700')} `}>
            {sale.payment_method}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
            <div className="flex items-center">
              <User className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span>{sale.customer?.name || sale.customer_name || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <Phone className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span>{sale.customer?.phone || sale.customer_phone || 'N/A'}</span>
            </div>
            {(sale.customer?.email || sale.customer_email) && (
              <div className="flex items-center">
                <Mail className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span>{sale.customer?.email || sale.customer_email}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">Payment Information</h2>
            <div className="flex items-center">
              <CreditCard className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span>Method: {sale.payment_method}</span>
            </div>
            {sale.payment_id && (
              <div className="flex items-center">
                <Hash className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className="truncate">ID: {sale.payment_id}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <span>Date: {new Date(sale.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShoppingCart className={`w-5 h-5 mr-3 ${settings.darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            Items Purchased
          </h2>
          <div className="space-y-3">
            {sale.sale_items.map(item => (
              <div key={item.id} className={`p-3 rounded-lg flex justify-between items-center ${settings.darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <div>
                  <p className="font-medium">{item.product?.name || 'Product not found'}</p>
                  <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ref: {item.product?.reference_number || 'N/A'} | Size: {item.size || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p>{item.quantity} x {settings.currency.symbol}{item.unit_price.toFixed(2)}</p>
                  <p className="font-medium">{settings.currency.symbol}{item.total_price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currency.symbol}{(sale.total_amount + sale.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount: ({(settings.taxRate * 100).toFixed(0)}%):</span>
                <span>{settings.currency.symbol}{sale.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total:</span>
                <span>{settings.currency.symbol}{(sale.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'none' }}>
        <Invoice ref={invoiceRef} {...invoiceDataForPrint} />
      </div>
    </motion.div>
  );
};

export default SaleDetail;
