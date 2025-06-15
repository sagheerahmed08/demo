
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';

const ProductSearchModal = ({ isOpen, onClose, products, onProductSelect, onProductSelectWithSite, settings, toast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.reference_number && product.reference_number.toLowerCase().includes(searchLower))
    );
  });

  const handleProductSelect = (product) => {
    if (onProductSelectWithSite) {
      if (!selectedSize) {
        toast({
          title: "Size Required",
          description: "Please select a size before adding the product.",
          variant: "destructive"
        });
        return;
      }
      onProductSelectWithSite(product, selectedSize);
    } else if (onProductSelect) {
      onProductSelect(product);
    }
    setSelectedSize('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Product to Sale</DialogTitle>
          <DialogDescription>Search for a product and add it to the current sale.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
          <div className={`max-h-[40vh] overflow-y-auto space-y-2 pr-2 ${settings?.darkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar'}`}>
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <div 
                key={product.id} 
                className={`p-3 rounded-lg ${settings?.darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ref: {product.reference_number}</p>
                    <p className="text-sm">{settings?.currency?.symbol}{product.price.toFixed(2)}</p>
                  </div>
                </div>
                {product.product_variants && (
                  <div className="mt-2">
                    <select
                      className={`w-full p-2 rounded-md mb-2 ${settings?.darkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                    >
                      <option value="">Select Size</option>
                      {product.product_variants.map(variant => (
                        <option 
                          key={variant.id} 
                          value={variant.size}
                          disabled={variant.stock === 0}
                        >
                          {variant.size} ({variant.stock} in stock)
                        </option>
                      ))}
                    </select>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleProductSelect(product)}
                      disabled={!selectedSize}
                      className="w-full"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Add to Sale
                    </Button>
                  </div>
                )}
              </div>
            )) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No products found.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchModal;
