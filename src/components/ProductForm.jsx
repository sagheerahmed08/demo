
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
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

const ProductForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    reference_number: '',
  });
  const [variants, setVariants] = useState([{ size: '', stock: '' }]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('product_categories').select('name').order('name');
    if (error) {
      console.error('Error fetching categories:', error);
      toast({ title: 'Error', description: 'Could not fetch product categories.', variant: 'destructive' });
    } else {
      setCategories(data.map(c => c.name));
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [toast]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        price: initialData.price || '',
        category: initialData.category || '',
        reference_number: initialData.reference_number || '',
      });
      setVariants(initialData.product_variants && initialData.product_variants.length > 0 
        ? initialData.product_variants.map(v => ({ size: v.size, stock: v.stock })) 
        : [{ size: '', stock: '' }]
      );
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        reference_number: '',
      });
      setVariants([{ size: '', stock: '' }]);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category) {
        toast({ title: 'Category Required', description: 'Please select or add a product category.', variant: 'destructive'});
        return;
    }
    if (variants.some(v => !v.size.trim() || v.stock === '' || parseInt(v.stock) < 0)) {
      toast({ title: 'Invalid Variants', description: 'Please ensure all sizes have a name and a valid stock quantity (0 or more).', variant: 'destructive'});
      return;
    }
    onSubmit(
      { ...formData, price: parseFloat(formData.price) },
      variants.map(v => ({ ...v, stock: parseInt(v.stock) }))
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const newVariants = [...variants];
    newVariants[index][name] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', stock: '' }]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants);
    } else {
      toast({ title: 'Cannot Remove', description: 'At least one size variant is required.', variant: 'destructive' });
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) {
      toast({ title: 'Error', description: 'Category name cannot be empty.', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase
      .from('product_categories')
      .insert({ name: newCategory.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        toast({ title: 'Category Exists', description: `Category "${newCategory.trim()}" already exists.`, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Could not add new category.', variant: 'destructive' });
      }
    } else if (data) {
      await fetchCategories(); 
      setFormData(prev => ({ ...prev, category: data.name }));
      setNewCategory('');
      setShowNewCategoryInput(false);
      toast({ title: 'Success', description: `Category "${data.name}" added.` });
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!categoryName) return;
    try {
      const { data: productsInCategory, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('category', categoryName)
        .limit(1);

      if (checkError) throw checkError;

      if (productsInCategory && productsInCategory.length > 0) {
        toast({
          title: "Deletion Prevented",
          description: `Category "${categoryName}" is used by existing products and cannot be deleted.`,
          variant: "destructive",
          duration: 7000,
        });
        setCategoryToDelete(null);
        return;
      }

      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('name', categoryName);

      if (deleteError) throw deleteError;

      toast({ title: 'Success', description: `Category "${categoryName}" deleted.` });
      await fetchCategories();
      if (formData.category === categoryName) {
        setFormData(prev => ({ ...prev, category: '' }));
      }
    } catch (error) {
      toast({ title: 'Error', description: `Failed to delete category: ${error.message}`, variant: 'destructive' });
    }
    setCategoryToDelete(null);
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {initialData ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reference Number</label>
                <Input type="text" name="reference_number" value={formData.reference_number} onChange={handleChange} className="w-full" required placeholder="e.g., REF-001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product Name</label>
                <Input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Price</label>
                <Input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full" step="0.01" min="0" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                <div className="flex items-center space-x-2">
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-grow" required>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCategoryInput(prev => !prev)} aria-label="Add new category">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                  {formData.category && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" size="icon" onClick={() => setCategoryToDelete(formData.category)} aria-label="Delete selected category">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        {categoryToDelete && (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category "{categoryToDelete}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Are you sure you want to delete this category? It will only be deleted if no products are currently using it.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(categoryToDelete)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                    </AlertDialog>
                  )}
                </div>
                {showNewCategoryInput && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" className="flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <Button type="button" onClick={handleAddNewCategory}>Add</Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sizes & Stock</label>
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input type="text" name="size" placeholder="Size (e.g., S, M, L, 32)" value={variant.size} onChange={(e) => handleVariantChange(index, e)} className="w-1/2" required />
                    <Input type="number" name="stock" placeholder="Stock" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} className="w-1/2" min="0" required />
                    {variants.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(index)} aria-label="Remove size variant">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addVariant} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Size
                </Button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit">{initialData ? 'Update' : 'Add'} Product</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductForm;
