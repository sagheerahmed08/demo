
import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductList = ({ products, addToCart, settings }) => {
  const neumorphismClass = settings.darkMode ? 'neumorphism-dark' : 'neumorphism';
  const cardHoverClass = settings.darkMode 
    ? 'hover:bg-gray-700/60 hover:shadow-gray-600/30' 
    : 'hover:bg-gray-100/80 hover:shadow-gray-300/50';

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${neumorphismClass} rounded-xl`}>
        <PackageSearch className="w-16 h-16 mx-auto mb-4 text-primary/50" />
        <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
        <p className={`${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Try adjusting your search or add new products to your inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => {
        const totalStock = product.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
        const hasVariants = product.product_variants && product.product_variants.length > 0;
        const isOutOfStock = totalStock === 0;

        return (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className={`${neumorphismClass} rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${cardHoverClass} ${isOutOfStock ? 'opacity-60' : ''}`}
          >
            <div>
              <h3 className={`font-semibold truncate ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{product.name}</h3>
              <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ref: {product.reference_number}</p>
              <p className={`text-lg font-bold my-1 ${settings.darkMode ? 'text-primary-foreground' : 'text-primary'}`}>{settings.currency.symbol}{product.price.toFixed(2)}</p>
              <p className={`text-xs ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Stock: <span className="font-medium">{totalStock}</span>
              </p>
              {product.product_variants && product.product_variants.length > 0 && (
                <div className="mt-1">
                  <p className={`text-xs font-medium ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sizes:</p>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {product.product_variants.slice(0, 3).map(v => (
                      <span key={v.id} className={`${settings.darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'} px-1 rounded`}>
                        {v.size} ({v.stock})
                      </span>
                    ))}
                    {product.product_variants.length > 3 && <span className="text-xs">...</span>}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={() => addToCart(product)}
              className="w-full mt-3 text-sm"
              size="sm"
              disabled={!hasVariants || isOutOfStock}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {isOutOfStock ? 'Out of Stock' : (hasVariants ? 'Add to Cart' : 'No Sizes')}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProductList;
