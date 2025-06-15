
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase'; 

import CustomerDetailsForm from '@/components/edit_sale/CustomerDetailsForm';
import SaleItemsManager from '@/components/edit_sale/SaleItemsManager';
import PaymentAndDateForm from '@/components/edit_sale/PaymentAndDateForm';
import SaleTotalsDisplay from '@/components/edit_sale/SaleTotalsDisplay';
import ProductSearchModal from '@/components/billing/ProductSearchModal'; 

const EditSale = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const { getSaleById, updateSale } = useSales();
  const { products: allProducts, fetchProducts: fetchProductsHook } = useProducts();
  const { settings } = useShopSettings();
  const { toast } = useToast();

  const [saleDetails, setSaleDetails] = useState(null);
  const [originalSaleItemsStore, setOriginalSaleItemsStore] = useState([]); 
  const [currentSaleItems, setCurrentSaleItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProductSearchModalOpen, setIsProductSearchModalOpen] = useState(false);

  useEffect(() => {
    fetchProductsHook();
  }, [fetchProductsHook]);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      setLoading(true);
      const data = await getSaleById(saleId);
      if (data) {
        setSaleDetails(data);
        const items = data.sale_items.map(item => ({ 
          ...item, 
          // Ensure product_id, name, reference_number, and price are directly on the item for consistency
          product_id: item.product_id || item.product?.id, 
          name: item.product?.name || 'N/A',
          reference_number: item.product?.reference_number || 'N/A',
          price: item.unit_price, // This should be the price at the time of sale
        }));
        setOriginalSaleItemsStore(JSON.parse(JSON.stringify(items))); // Deep copy for original state
        setCurrentSaleItems(items);
        setCustomerInfo({ 
          name: data.customer_name || data.customer?.name || '', 
          phone: data.customer_phone || data.customer?.phone || '', 
          email: data.customer_email || data.customer?.email || '' 
        });
        setPaymentMethod(data.payment_method);
        setSaleDate(new Date(data.created_at).toISOString().slice(0, 16));
      } else {
        toast({ title: "Error", description: "Sale not found.", variant: "destructive" });
        navigate('/billing'); 
      }
      setLoading(false);
    };
    if (saleId) {
      fetchSaleDetails();
    }
  }, [saleId, getSaleById, toast, navigate]);

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculateSubtotal = useCallback(() => {
    return currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [currentSaleItems]);

  const calculateTax = useCallback((subtotal) => {
    return subtotal * (settings.taxRate || 0);
  }, [settings.taxRate]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  }, [calculateSubtotal, calculateTax]);

  const handleAddNewItemToSale = (product, selectedSize) => {
    const variant = product.product_variants.find(v => v.size === selectedSize);
    if (!variant || variant.stock === 0) {
      toast({ title: "Out of Stock", description: `Size ${selectedSize} for ${product.name} is out of stock.`, variant: "destructive" });
      return;
    }

    const existingItemIndex = currentSaleItems.findIndex(item => item.product_id === product.id && item.size === selectedSize);

    if (existingItemIndex > -1) {
      const updatedItems = [...currentSaleItems];
      if (updatedItems[existingItemIndex].quantity < variant.stock) { // Check against current variant stock
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        setCurrentSaleItems(updatedItems);
      } else {
        toast({ title: "Stock Limit Reached", description: `Cannot add more of size ${selectedSize}. Max stock: ${variant.stock}.`, variant: "destructive" });
      }
    } else {
      setCurrentSaleItems(prevItems => [...prevItems, {
        // id: `new-${product.id}-${selectedSize}`, // Temporary ID for new items if needed for key, but product_id is main
        product_id: product.id,
        name: product.name,
        reference_number: product.reference_number,
        quantity: 1,
        price: product.price, // Base product price
        unit_price: product.price, // Ensure unit_price is set
        total_price: product.price, // For one item
        size: selectedSize,
        product: { name: product.name, reference_number: product.reference_number } // For consistency if needed by other parts
      }]);
    }
    setIsProductSearchModalOpen(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!customerInfo.name || !customerInfo.phone) {
      toast({ title: "Validation Error", description: "Customer name and phone are required.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    if (currentSaleItems.length === 0) {
      toast({ title: "Validation Error", description: "Cannot save a sale with no items.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax(subtotal);
    const totalAmount = subtotal + taxAmount;

    const updatedSaleData = {
      customer_id: saleDetails.customer?.id || saleDetails.customer_id, 
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_email: customerInfo.email,
      payment_method: paymentMethod,
      created_at: new Date(saleDate).toISOString(),
      total_amount: totalAmount,
      tax_amount: taxAmount,
    };
    
    try {
      await updateSale(saleId, updatedSaleData, currentSaleItems, originalSaleItemsStore, allProducts);
      toast({ title: "Success", description: "Sale updated successfully." });
      navigate(`/sales/invoice/${saleDetails.invoice_number}`);
    } catch (error) {
      toast({ title: "Error", description: `Failed to update sale: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const checkAndFillCustomer = useCallback(async (phone) => {
    if (phone && phone.length >= 7) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('name, email')
          .eq('phone', phone)
          .limit(1); 
        
        if (error) {
          console.error("Error checking customer:", error.message);
        } else if (data && data.length > 0) {
          setCustomerInfo(prev => ({ ...prev, name: data[0].name, email: data[0].email || '' }));
          toast({ title: "Customer Found", description: `Filled details for ${data[0].name}.` });
        }
      } catch (error) {
        console.error("Catch block: Error checking customer:", error.message);
      }
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only autofill if name is empty, to prevent overriding manual input
      if (customerInfo.phone && !customerInfo.name && !loading) { 
        checkAndFillCustomer(customerInfo.phone);
      }
    }, 1000); 
    return () => clearTimeout(timer);
  }, [customerInfo.phone, customerInfo.name, checkAndFillCustomer, loading]);


  if (loading) {
    return <div className="text-center py-10">Loading sale details for editing...</div>;
  }

  if (!saleDetails) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" />
        <p className="text-xl">Sale not found or could not be loaded.</p>
        <Button onClick={() => navigate('/billing')} className="mt-4">Go to Billing</Button>
      </div>
    );
  }

  const neumorphismClass = settings.darkMode ? 'neumorphism-dark' : 'neumorphism';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Sale (Invoice: {saleDetails.invoice_number})</h1>
      </div>

      <form onSubmit={handleSubmit} className={`space-y-6 ${neumorphismClass} p-6 rounded-xl`}>
        <CustomerDetailsForm 
          customerInfo={customerInfo} 
          onCustomerInfoChange={handleCustomerInfoChange} 
          darkMode={settings.darkMode}
        />
        
        <SaleItemsManager
          saleItems={currentSaleItems}
          setSaleItems={setCurrentSaleItems}
          originalSaleItems={originalSaleItemsStore}
          allProducts={allProducts}
          settings={settings}
          onOpenProductSearch={() => setIsProductSearchModalOpen(true)}
          toast={toast}
        />

        <PaymentAndDateForm
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          saleDate={saleDate}
          onSaleDateChange={setSaleDate}
          darkMode={settings.darkMode}
        />

        <SaleTotalsDisplay
          subtotal={calculateSubtotal()}
          taxAmount={calculateTax(calculateSubtotal())}
          totalAmount={calculateTotal()}
          settings={settings}
          taxRate={settings.taxRate || 0}
        />

        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <ProductSearchModal
        isOpen={isProductSearchModalOpen}
        onClose={() => setIsProductSearchModalOpen(false)}
        products={allProducts}
        onProductSelectWithSite={handleAddNewItemToSale}
        settings={settings}
        toast={toast}
      />

    </motion.div>
  );
};

export default EditSale;
