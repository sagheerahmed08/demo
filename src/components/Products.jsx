
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertTriangle, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import ProductForm from '@/components/ProductForm';
import { useToast } from '@/components/ui/use-toast';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Products = () => {
  const { products, addProduct, updateProduct, deleteProduct: deleteProductHook } = useProducts();
  const { toast } = useToast();
  const { settings } = useShopSettings();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleSubmit = async (productData, variantsData) => {
    try {
      if (editingProduct) {
        await updateProduct({ ...productData, id: editingProduct.id }, variantsData);
        toast({
          title: "Product Updated",
          description: "Product has been successfully updated.",
        });
      } else {
        await addProduct(productData, variantsData);
        toast({
          title: "Product Added",
          description: "New product has been successfully added.",
        });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast({
        title: "Error Processing Product",
        description: error.message || "There was an error processing your request.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      const success = await deleteProductHook(productId);
      if (success) {
        toast({
          title: "Product Deleted",
          description: "Product has been successfully removed.",
        });
      }
    } catch (error) {
      toast({
        title: "Error Deleting Product",
        description: error.message || "There was an error deleting the product.",
        variant: "destructive",
      });
    }
  };

  const neumorphismClass = settings.darkMode ? 'neumorphism-dark' : 'neumorphism';
  const cardHoverClass = settings.darkMode 
    ? 'hover:bg-gray-700/50 hover:shadow-gray-600/30' 
    : 'hover:bg-gray-100/70 hover:shadow-gray-300/50';
  const buttonHoverClass = settings.darkMode
    ? 'hover:bg-gray-600'
    : 'hover:bg-gray-100';
  const deleteButtonHoverClass = settings.darkMode
    ? 'hover:bg-red-700/30'
    : 'hover:bg-red-100';


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Products</h1>
          <p className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 text-lg`}>Manage your product inventory, sizes, and details.</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="flex items-center space-x-2 mt-4 sm:mt-0"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Product</span>
        </Button>
      </div>

      {products.length === 0 && (
        <div className={`text-center py-12 ${neumorphismClass} rounded-xl`}>
            <PackageSearch className="w-16 h-16 mx-auto mb-4 text-primary/50" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                It looks like you haven't added any products yet.
            </p>
            <Button
                onClick={() => {
                    setEditingProduct(null);
                    setIsFormOpen(true);
                }}
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
            </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {products.map((product) => {
            const totalStock = product.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
            return (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${neumorphismClass} rounded-xl p-6 space-y-4 flex flex-col justify-between transition-all duration-300 ${cardHoverClass}`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="max-w-[calc(100%-4rem)]">
                    <h3 className={`text-xl font-semibold truncate ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{product.name}</h3>
                    <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ref: {product.reference_number}</p>
                  </div>
                  <div className="flex space-x-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className={`w-8 h-8 rounded-full ${buttonHoverClass} ${settings.darkMode ? 'text-gray-300 hover:text-primary' : 'text-gray-500 hover:text-primary'}`}
                      aria-label="Edit product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 rounded-full ${deleteButtonHoverClass} ${settings.darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={`${settings.darkMode ? 'dark' : ''}`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Deleting "{product.name}" will permanently remove it and all its size variants.
                            If this product is part of existing sales, deletion might be prevented.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">
                            Yes, delete product
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </div>
                </div>

                <div className="space-y-2">
                  <p className={`text-2xl font-bold ${settings.darkMode ? 'text-primary-foreground' : 'text-primary'}`}>{settings.currency.symbol}{product.price.toFixed(2)}</p>
                  <p className={`text-sm ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Category: {product.category}</p>
                  <div className="text-sm">
                    <p className={`${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Stock: <span className="font-semibold">{totalStock}</span>
                    </p>
                    {totalStock < 10 && totalStock > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${settings.darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-600'}`}>
                        Low Stock
                      </span>
                    )}
                    {totalStock === 0 && (
                       <span className={`text-xs px-2 py-0.5 rounded-full ${settings.darkMode ? 'bg-yellow-700 text-yellow-100' : 'bg-yellow-100 text-yellow-700'}`}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                  {product.product_variants && product.product_variants.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-xs font-medium ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sizes:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.product_variants.map(variant => (
                          <span key={variant.id} className={`text-xs px-1.5 py-0.5 rounded-full ${settings.darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
                            {variant.size}: {variant.stock}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )})}
        </AnimatePresence>
      </div>

      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingProduct}
      />
    </div>
  );
};

export default Products;
