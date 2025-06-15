
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (id, size, stock)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithAggregatedStock = data.map(p => ({
        ...p,
        stock: p.product_variants.reduce((sum, v) => sum + v.stock, 0)
      }));
      setProducts(productsWithAggregatedStock || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products: " + error.message,
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchProducts();
    
    const productsChannel = supabase
      .channel('products_realtime_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'products'
      }, (payload) => {
        fetchProducts(); 
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'product_variants'
      }, (payload) => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [fetchProducts]);


  const addProduct = async (productData, variantsData) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{ 
          name: productData.name, 
          price: productData.price, 
          category: productData.category, 
          reference_number: productData.reference_number 
        }])
        .select()
        .single();

      if (productError) throw productError;

      if (product && variantsData && variantsData.length > 0) {
        const variantsToInsert = variantsData.map(variant => ({
          product_id: product.id,
          size: variant.size,
          stock: variant.stock
        }));
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);
        if (variantsError) throw variantsError;
      }
      fetchProducts(); 
      return product;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProduct = async (productData, variantsData) => {
    try {
      const { data: updatedProduct, error: productError } = await supabase
        .from('products')
        .update({ 
          name: productData.name, 
          price: productData.price, 
          category: productData.category, 
          reference_number: productData.reference_number 
        })
        .eq('id', productData.id)
        .select()
        .single();

      if (productError) throw productError;

      if (updatedProduct && variantsData) {
        // Delete existing variants for this product
        await supabase.from('product_variants').delete().eq('product_id', updatedProduct.id);
        
        // Insert new variants
        if (variantsData.length > 0) {
          const variantsToInsert = variantsData.map(variant => ({
            product_id: updatedProduct.id,
            size: variant.size,
            stock: variant.stock
          }));
          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert);
          if (variantsError) throw variantsError;
        }
      }
      fetchProducts();
      return updatedProduct;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const { data: saleItems, error: checkError } = await supabase
        .from('sale_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (checkError) throw checkError;

      if (saleItems && saleItems.length > 0) {
        toast({
          title: "Deletion Prevented",
          description: "This product is part of existing sales and cannot be deleted. Consider marking it as inactive instead.",
          variant: "destructive",
          duration: 7000,
        });
        return false; 
      }
      
      await supabase.from('product_variants').delete().eq('product_id', productId);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;
      fetchProducts();
      return true; 
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product: " + error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };
};
