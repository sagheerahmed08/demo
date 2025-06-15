import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShoppingCart, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import { useReactToPrint } from 'react-to-print';
import Invoice from '@/components/Invoice';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import ProductSearch from '@/components/billing/ProductSearch';
import ProductList from '@/components/billing/ProductList';
import CartDisplay from '@/components/billing/CartDisplay';
import CustomerForm from '@/components/billing/CustomerForm';
import BillSummary from '@/components/billing/BillSummary';
import PaymentOptions from '@/components/billing/PaymentOptions';
import { supabase } from '@/lib/supabase';
import { loadRazorpayScript } from '@/utils/razorpay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { mapInvoiceData } from '@/utils/mapInvoiceData';
import { renderItemsTable } from '@/utils/renderItemsTable';
import { sendInvoiceEmail } from '@/utils/emailjs';

const Billing = () => {
  const { products: allProducts, fetchProducts } = useProducts();
  const { toast } = useToast();
  const { settings } = useShopSettings();
  const { createSale } = useSales();

  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', paymentMethod: 'CASH' });
  const [invoiceData, setInvoiceData] = useState(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSizeSelectionModalOpen, setIsSizeSelectionModalOpen] = useState(false);
  const [productForSizeSelection, setProductForSizeSelection] = useState(null);
  const [selectedSizeForCart, setSelectedSizeForCart] = useState('');

  const invoiceRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
  });

  const filteredProducts = allProducts.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.reference_number && product.reference_number.toLowerCase().includes(searchLower))
    );
  });

  const openSizeSelectionModal = (product) => {
    if (!product.product_variants || product.product_variants.length === 0) {
      toast({ title: "No Sizes Available", description: "This product has no defined sizes or stock.", variant: "destructive" });
      return;
    }
    setProductForSizeSelection(product);
    setSelectedSizeForCart(product.product_variants[0]?.size || '');
    setIsSizeSelectionModalOpen(true);
  };

  const handleSizeSelectedAndAddToCart = () => {
    if (!productForSizeSelection || !selectedSizeForCart) return;

    const variant = productForSizeSelection.product_variants.find(v => v.size === selectedSizeForCart);
    if (!variant) {
      toast({ title: "Error", description: "Selected size not found for this product.", variant: "destructive" });
      return;
    }

    if (variant.stock === 0) {
      toast({ title: "Out of Stock", description: `Size ${selectedSizeForCart} is out of stock.`, variant: "destructive" });
      return;
    }

    const cartItemKey = `${productForSizeSelection.id}-${selectedSizeForCart}`;
    const existingItem = cart.find(item => item.cartKey === cartItemKey);

    if (existingItem) {
      if (existingItem.quantity >= variant.stock) {
        toast({ title: "Stock Limit Reached", description: `Cannot add more of size ${selectedSizeForCart}. Max stock: ${variant.stock}.`, variant: "destructive" });
        return;
      }
      setCart(cart.map(item => item.cartKey === cartItemKey ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        ...productForSizeSelection, 
        id: productForSizeSelection.id,
        cartKey: cartItemKey, 
        size: selectedSizeForCart, 
        stock: variant.stock,
        price: productForSizeSelection.price,
        quantity: 1 
      }]);
    }
    setIsSizeSelectionModalOpen(false);
    setProductForSizeSelection(null);
  };

  const removeFromCart = (cartKey) => {
    setCart(cart.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, newQuantity) => {
    const cartItem = cart.find(item => item.cartKey === cartKey);
    if (!cartItem) return;

    const productDetails = allProducts.find(p => p.id === cartItem.id);
    if (!productDetails) return;

    const variant = productDetails.product_variants.find(v => v.size === cartItem.size);
    if (!variant) return;

    if (newQuantity > variant.stock) {
      toast({ title: "Stock Limit Reached", description: `Cannot add more than ${variant.stock} items for size ${cartItem.size}.`, variant: "destructive" });
      setCart(cart.map(item => item.cartKey === cartKey ? { ...item, quantity: variant.stock } : item));
      return;
    }
    if (newQuantity < 1) {
      removeFromCart(cartKey);
      return;
    }
    setCart(cart.map(item => item.cartKey === cartKey ? { ...item, quantity: newQuantity } : item));
  };

  const calculateSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const calculateTax = useCallback((subtotal) => {
    return subtotal * (settings.taxRate || 0);
  }, [settings.taxRate]);

  const calculateTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return Math.max(0, subtotal - tax);
  }, [calculateSubtotal, calculateTax]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const checkAndFillCustomer = useCallback(async (phone) => {
    if (phone && phone.length >= 7) { 
      setIsCheckingCustomer(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('name, email')
          .eq('phone', phone)
          .limit(1); 
        
        if (error) {
          console.error("Error checking customer (non-PGRST116):", error.message);
        } else if (data && data.length > 0) {
          setCustomerInfo(prev => ({ ...prev, name: data[0].name, email: data[0].email || '' }));
          toast({ title: "Customer Found", description: `Filled details for ${data[0].name}.` });
        }
      } catch (error) {
        console.error("Catch block: Error checking customer:", error.message);
      } finally {
        setIsCheckingCustomer(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerInfo.phone && !customerInfo.name) { 
        checkAndFillCustomer(customerInfo.phone);
      }
    }, 1000); 
    return () => clearTimeout(timer);
  }, [customerInfo.phone, customerInfo.name, checkAndFillCustomer]);

  const proceedToCompleteSale = async (paymentDetails = {}) => {
    setIsProcessingPayment(true);
    const subtotal = calculateSubtotal();
    const taxAmount = calculateTax(subtotal);
    const totalAmount = Math.max(0, subtotal - taxAmount);
    const invoiceNumberFallback = `INV-${Date.now()}`;
    const saleDate = new Date().toLocaleDateString();

    const saleDataForDB = {
      invoiceNumber: invoiceNumberFallback,
      customer_name: customerInfo.name, 
      customer_phone: customerInfo.phone, 
      customer_email: customerInfo.email,
      totalAmount,
      taxAmount,
      paymentMethod: paymentDetails.method || customerInfo.paymentMethod,
      saleDate: new Date(), 
      payment_id: paymentDetails.id || null,
      date: saleDate
    };

    try {
      const newSale = await createSale(saleDataForDB, cart);
      await fetchProducts(); 

      const invoiceNumber = newSale.invoice_number || saleDataForDB.invoiceNumber || invoiceNumberFallback;

      // Compose invoice data for printing
      setInvoiceData({
        items: cart,
        customerInfo,
        subtotal,
        tax: taxAmount,
        total: subtotal - taxAmount,
        invoiceNumber,
        paymentMethod: saleDataForDB.paymentMethod,
        paymentId: saleDataForDB.payment_id,
      });

      if (customerInfo.email) {
        // --- EMAIL SENDING BLOCK (added as per your request) ---
        const mappedInvoice = mapInvoiceData({
          items: cart,
          customerInfo,
          subtotal,
          tax: taxAmount,
          total: subtotal - taxAmount,
          invoiceNumber,
          paymentMethod: saleDataForDB.paymentMethod,
          paymentId: saleDataForDB.payment_id,
          settings
        });
        const html = `
          <h2>Invoice #${mappedInvoice.invoiceNumber}</h2>
          ${renderItemsTable(mappedInvoice.items, mappedInvoice.currency)}
          <p><strong>Subtotal:</strong> ${mappedInvoice.currency}${mappedInvoice.subtotal}</p>
          <p><strong>Discount (${mappedInvoice.discountPercent}%):</strong> -${mappedInvoice.currency}${mappedInvoice.discount}</p>
          <p><strong>Total:</strong> ${mappedInvoice.currency}${mappedInvoice.total}</p>
        `;

        await sendInvoiceEmail({
          ...mappedInvoice,
          html
        })
        .then(() =>
          toast({ title: "Invoice Sent", description: "Invoice was sent via email." })
        )
        .catch(() =>
          toast({ title: "Email Failed", description: "Could not send invoice email.", variant: "destructive" })
        );
        // --- END EMAIL SENDING BLOCK ---
      }
      toast({ title: "Sale Complete", description: `Invoice ${invoiceNumber} has been generated.` });
    } catch (error) {
      console.error("Checkout error details:", error);
      toast({ title: "Error Processing Sale", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (cart.length === 0 || !customerInfo.name || !customerInfo.phone) {
      toast({ title: "Missing Information", description: "Please add items to cart and enter customer name & phone.", variant: "destructive" });
      return;
    }
    setIsProcessingPayment(true);
    const res = await loadRazorpayScript();

    if (!res) {
      toast({ title: "Razorpay SDK Error", description: "Razorpay SDK failed to load. Please try again or use another payment method.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const totalAmount = calculateTotal();

    const options = {
      key: "rzp_test_56ZvanY5WuU84v", 
      amount: Math.round(totalAmount * 100), 
      currency: settings.currency?.name || "INR",
      name: settings.shopName || "Fashion Hub",
      description: "Payment for Goods",
      handler: function (response) {
        toast({ title: "Payment Successful!", description: `Payment ID: ${response.razorpay_payment_id}`});
        proceedToCompleteSale({
          method: 'RAZORPAY',
          id: response.razorpay_payment_id,
        });
      },
      prefill: {
        name: customerInfo.name,
        contact: customerInfo.phone,
        email: customerInfo.email,
      },
      notes: {
        address: settings.address || "Fashion Street, India",
        invoice_number_placeholder: `INV-${Date.now()}` 
      },
      theme: {
        color: "#3399cc", 
      },
      modal: {
        ondismiss: function() {
          setIsProcessingPayment(false);
          toast({ title: "Payment Cancelled", description: "You cancelled the payment.", variant: "destructive" });
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response){
      console.error("Razorpay Payment Failed:", response);
      toast({
          title: "Payment Failed",
          description: `${response.error.description} (Code: ${response.error.code})`,
          variant: "destructive",
      });
      setIsProcessingPayment(false);
    });
    rzp.open();
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !customerInfo.name || !customerInfo.phone) {
      toast({ title: "Missing Information", description: "Please add items to cart and enter customer name & phone.", variant: "destructive" });
      return;
    }
    if (customerInfo.paymentMethod === 'RAZORPAY') {
      handleRazorpayPayment();
    } else {
      proceedToCompleteSale();
    }
  };

  const handlePrintAndClear = () => {
    if (invoiceData) {
      handlePrint(); 
      setCart([]);
      setCustomerInfo({ name: '', phone: '', email: '', paymentMethod: 'CASH' });
      setInvoiceData(null);
      setSearchQuery(''); 
    } else {
      toast({ title: "No Invoice", description: "Please complete a sale first to generate an invoice.", variant: "destructive" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <ProductSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <ProductList 
          products={filteredProducts} 
          addToCart={openSizeSelectionModal} 
          settings={settings} 
        />
      </div>

      <div className={`${settings.darkMode ? 'neumorphism-dark' : 'neumorphism'} rounded-xl p-6 space-y-6 flex flex-col`}>
        <h2 className="text-2xl font-bold">Current Bill</h2>
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
          <CustomerForm 
            customerInfo={customerInfo} 
            handleCustomerInfoChange={handleCustomerInfoChange} 
            isCheckingCustomer={isCheckingCustomer}
            darkMode={settings.darkMode}
          />
          <PaymentOptions customerInfo={customerInfo} handleCustomerInfoChange={handleCustomerInfoChange} darkMode={settings.darkMode} />
          
          {cart.length === 0 ? (
            <div className={`text-center py-8 mt-4 ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
              <p>No items in cart</p>
            </div>
          ) : (
            <div className="mt-6">
              <CartDisplay 
                cart={cart} 
                updateQuantity={updateQuantity} 
                removeFromCart={removeFromCart}
                settings={settings} 
              />
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="mt-auto border-t pt-4">
            <BillSummary 
              subtotal={calculateSubtotal()} 
              tax={calculateTax(calculateSubtotal())} 
              total={calculateTotal()} 
              settings={settings} 
            />
            <Button
              className="w-full mt-4"
              onClick={handleCheckout}
              disabled={invoiceData !== null || isCheckingCustomer || isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : (customerInfo.paymentMethod === 'RAZORPAY' ? 'Pay with Razorpay' : 'Complete Sale')}
            </Button>
            {invoiceData && (
               <Button
                className="w-full mt-2 flex items-center"
                variant="outline"
                onClick={handlePrintAndClear}
              >
                <Printer className="w-4 h-4 mr-2" /> Print Invoice & New Sale
              </Button>
            )}
            {customerInfo.paymentMethod === 'RAZORPAY' && (
              <p className="text-xs text-center mt-2 text-muted-foreground flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-green-500" /> Secure Payments by Razorpay
              </p>
            )}
          </div>
        )}
      </div>
      {invoiceData && (
        <div style={{ display: 'none' }}>
          <Invoice ref={invoiceRef} {...invoiceData} />
        </div>
      )}

      {isSizeSelectionModalOpen && productForSizeSelection && (
        <Dialog open={isSizeSelectionModalOpen} onOpenChange={() => { setIsSizeSelectionModalOpen(false); setProductForSizeSelection(null); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Size for {productForSizeSelection.name}</DialogTitle>
              <DialogDescription>
                Choose an available size and stock for this product.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {productForSizeSelection.product_variants && productForSizeSelection.product_variants.length > 0 ? (
                <RadioGroup
                  value={selectedSizeForCart}
                  onValueChange={setSelectedSizeForCart}
                  className="space-y-2"
                >
                  {productForSizeSelection.product_variants.filter(v => v.stock > 0).map((variant) => (
                    <Label
                      key={variant.size}
                      htmlFor={`size-${variant.size}`}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all 
                        ${settings.darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-100/70'}
                        ${selectedSizeForCart === variant.size ? (settings.darkMode ? 'bg-gray-700 border-primary ring-1 ring-primary' : 'bg-primary/10 border-primary ring-1 ring-primary') : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={variant.size} id={`size-${variant.size}`} className="sr-only" />
                        <span className={`font-medium ${selectedSizeForCart === variant.size ? (settings.darkMode ? 'text-primary-foreground': 'text-primary') : ''}`}>{variant.size}</span>
                      </div>
                      <span className={`text-sm ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stock: {variant.stock}</span>
                    </Label>
                  ))}
                  {productForSizeSelection.product_variants.filter(v => v.stock > 0).length === 0 && (
                     <p className="text-center text-sm text-muted-foreground">All sizes for this product are currently out of stock.</p>
                  )}
                </RadioGroup>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">No sizes or stock defined for this product.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsSizeSelectionModalOpen(false); setProductForSizeSelection(null); }}>Cancel</Button>
              <Button onClick={handleSizeSelectedAndAddToCart} disabled={!selectedSizeForCart || productForSizeSelection.product_variants.filter(v => v.stock > 0).length === 0}>Add to Cart</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Billing;