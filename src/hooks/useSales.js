import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const TABLE_SALES = 'sales';
const TABLE_SALE_ITEMS = 'sale_items';
const TABLE_CUSTOMERS = 'customers';
const TABLE_PRODUCTS = 'products';
const TABLE_PRODUCT_VARIANTS = 'product_variants';
  
const SELECT_SALE_DETAILS = `
  id,
  invoice_number,
  customer_name,
  customer_phone,
  customer_email,
  total_amount,
  tax_amount,
  payment_method,
  payment_id,
  created_at,
  customer_id,
  sale_items (
    id,
    product_id,
    quantity,
    unit_price,
    total_price,
    size,
    product:products (name, reference_number)
  )
`;

export const useSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSupabaseError = useCallback((error, contextMessage) => {
    console.error(`${contextMessage}:`, error);
    toast({
      title: `Error ${contextMessage.toLowerCase()}`,
      description: error.message || "An unexpected error occurred.",
      variant: "destructive",
    });
    throw error;
  }, [toast]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_SALES)
        .select(SELECT_SALE_DETAILS)
        .order('created_at', { ascending: false });
      if (error) handleSupabaseError(error, "fetching sales");
      setSales(data || []);
    } catch (error) {
      // Error already handled by handleSupabaseError
    } finally {
      setLoading(false);
    }
  }, [handleSupabaseError]);

  const upsertCustomer = useCallback(async (customerData) => {
    let customerId = null;

    const { data: existingCustomers, error: fetchError } = await supabase
      .from(TABLE_CUSTOMERS)
      .select('id')
      .eq('phone', customerData.customer_phone)
      .limit(1);

    if (fetchError) throw fetchError;

    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      const { error: updateError } = await supabase
        .from(TABLE_CUSTOMERS)
        .update({
          name: customerData.customer_name,
          email: customerData.customer_email,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
      if (updateError) throw updateError;
    } else {
      const { data: newCustomer, error: insertError } = await supabase
        .from(TABLE_CUSTOMERS)
        .insert({
          name: customerData.customer_name,
          phone: customerData.customer_phone,
          email: customerData.customer_email,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      customerId = newCustomer.id;
    }
    return customerId;
  }, []);

  const insertSaleRecord = useCallback(async (saleData, customerId) => {
    const { data: newSale, error } = await supabase
      .from(TABLE_SALES)
      .insert({
        invoice_number: saleData.invoiceNumber,
        customer_name: saleData.customer_name,
        customer_phone: saleData.customer_phone,
        customer_email: saleData.customer_email,
        total_amount: saleData.totalAmount,
        tax_amount: saleData.taxAmount,
        payment_method: saleData.paymentMethod,
        payment_id: saleData.payment_id,
        customer_id: customerId,
        created_at: saleData.saleDate || new Date().toISOString(),
      })
      .select(SELECT_SALE_DETAILS)
      .single();
    if (error) throw error;
    return newSale;
  }, []);

  const updateVariantStock = useCallback(async (productId, size, quantity) => {
    const { data: variant, error: fetchError } = await supabase
      .from(TABLE_PRODUCT_VARIANTS)
      .select('stock')
      .eq('product_id', productId)
      .eq('size', size)
      .single();

    if (fetchError) throw fetchError;

    const newStock = variant.stock - quantity;
    if (newStock < 0) throw new Error(`Insufficient stock for product variant with size ${size}`);

    const { error: updateError } = await supabase
      .from(TABLE_PRODUCT_VARIANTS)
      .update({ stock: newStock })
      .eq('product_id', productId)
      .eq('size', size);

    if (updateError) throw updateError;
  }, []);

  const insertSaleItemsAndDecrementStock = useCallback(async (saleId, cartItems) => {
    const saleItemsToInsert = cartItems.map(item => ({
      sale_id: saleId,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      size: item.size,
    }));

    const { error: itemsError } = await supabase
      .from(TABLE_SALE_ITEMS)
      .insert(saleItemsToInsert);
    if (itemsError) throw itemsError;

    // Update stock for each item
    for (const item of cartItems) {
      await updateVariantStock(item.id, item.size, item.quantity);
    }
  }, [updateVariantStock]);

  const createSale = useCallback(async (saleData, cartItems) => {
    setLoading(true);
    try {
      const customerId = await upsertCustomer(saleData);
      const newSale = await insertSaleRecord(saleData, customerId);
      await insertSaleItemsAndDecrementStock(newSale.id, cartItems);
      await fetchSales();
      return newSale;
    } catch (error) {
      handleSupabaseError(error, "creating sale");
      return null;
    } finally {
      setLoading(false);
    }
  }, [upsertCustomer, insertSaleRecord, insertSaleItemsAndDecrementStock, fetchSales, handleSupabaseError]);

  const getSaleById = useCallback(async (saleId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_SALES)
        .select(SELECT_SALE_DETAILS)
        .eq('id', saleId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleSupabaseError(error, `fetching sale ${saleId}`);
      }
      return data;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleSupabaseError]);

  const getSaleByInvoiceNumber = useCallback(async (invoiceNumber) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_SALES)
        .select(SELECT_SALE_DETAILS)
        .eq('invoice_number', invoiceNumber)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        handleSupabaseError(error, `fetching invoice ${invoiceNumber}`);
      }
      return data;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleSupabaseError]);

  const updateSale = useCallback(async (saleId, updatedSaleData, currentSaleItems, originalSaleItems) => {
    setLoading(true);
    try {
      const { error: saleUpdateError } = await supabase
        .from(TABLE_SALES)
        .update(updatedSaleData)
        .eq('id', saleId);

      if (saleUpdateError) throw saleUpdateError;

      // Handle deleted items - return stock
      for (const originalItem of originalSaleItems) {
        const stillExists = currentSaleItems.find(item => 
          (item.id === originalItem.id) || 
          (item.product_id === originalItem.product_id && item.size === originalItem.size)
        );
        
        if (!stillExists) {
          const { error: returnStockError } = await supabase
            .from(TABLE_PRODUCT_VARIANTS)
            .update({ 
              stock: supabase.sql`stock + ${originalItem.quantity}` 
            })
            .eq('product_id', originalItem.product_id)
            .eq('size', originalItem.size);

          if (returnStockError) throw returnStockError;

          const { error: deleteError } = await supabase
            .from(TABLE_SALE_ITEMS)
            .delete()
            .eq('id', originalItem.id);

          if (deleteError) throw deleteError;
        }
      }

      // Handle modified and new items
      for (const currentItem of currentSaleItems) {
        const originalItem = originalSaleItems.find(item => 
          (item.id === currentItem.id) || 
          (item.product_id === currentItem.product_id && item.size === currentItem.size)
        );

        if (originalItem) {
          if (originalItem.quantity !== currentItem.quantity) {
            const quantityDiff = currentItem.quantity - originalItem.quantity;
            
            const { error: stockUpdateError } = await supabase
              .from(TABLE_PRODUCT_VARIANTS)
              .update({ 
                stock: supabase.sql`stock - ${quantityDiff}` 
              })
              .eq('product_id', currentItem.product_id)
              .eq('size', currentItem.size);

            if (stockUpdateError) throw stockUpdateError;

            const { error: itemUpdateError } = await supabase
              .from(TABLE_SALE_ITEMS)
              .update({
                quantity: currentItem.quantity,
                total_price: currentItem.price * currentItem.quantity
              })
              .eq('id', originalItem.id);

            if (itemUpdateError) throw itemUpdateError;
          }
        } else {
          const { error: stockUpdateError } = await supabase
            .from(TABLE_PRODUCT_VARIANTS)
            .update({ 
              stock: supabase.sql`stock - ${currentItem.quantity}` 
            })
            .eq('product_id', currentItem.product_id)
            .eq('size', currentItem.size);

          if (stockUpdateError) throw stockUpdateError;

          const { error: insertError } = await supabase
            .from(TABLE_SALE_ITEMS)
            .insert({
              sale_id: saleId,
              product_id: currentItem.product_id,
              quantity: currentItem.quantity,
              unit_price: currentItem.price,
              total_price: currentItem.price * currentItem.quantity,
              size: currentItem.size
            });

          if (insertError) throw insertError;
        }
      }

      await fetchSales();
    } catch (error) {
      handleSupabaseError(error, "updating sale");
    } finally {
      setLoading(false);
    }
  }, [fetchSales, handleSupabaseError]);

  useEffect(() => {
    fetchSales();
    const salesChannel = supabase
      .channel('sales_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_SALES }, fetchSales)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_SALE_ITEMS }, fetchSales)
      .subscribe();

    return () => {
      supabase.removeChannel(salesChannel);
    };
  }, [fetchSales]);

  return {
    sales,
    loading,
    fetchSales,
    createSale,
    getSaleById,
    getSaleByInvoiceNumber,
    updateSale
  };
};
