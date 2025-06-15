
import React from 'react';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

const LowStockAlerts = ({ lowStockItems, settings }) => {
  if (lowStockItems.length === 0) {
    return (
      <div className="text-center py-8">
        <PackageSearch className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p className={`${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>All products have sufficient stock!</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
      {lowStockItems.map(item => {
        const totalStock = item.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
        return (
          <Link to={`/products`} key={item.id} className={`block p-4 rounded-lg transition-all duration-200 ease-in-out
            ${settings.darkMode 
              ? 'bg-gray-700/50 hover:bg-gray-600/70 shadow-md hover:shadow-gray-600/40' 
              : 'bg-red-50 hover:bg-red-100/70 shadow-md hover:shadow-red-200/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold ${settings.darkMode ? 'text-red-300' : 'text-red-700'}`}>{item.name}</h4>
                <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ref: {item.reference_number}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${settings.darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  Stock: {totalStock}
                </p>
                {item.product_variants && item.product_variants.length > 0 && (
                  <div className="text-xs mt-1">
                    {item.product_variants.filter(v => v.stock < 10).map(v => (
                      <span key={v.id} className={`mr-1 px-1 rounded ${settings.darkMode ? 'bg-red-800/70 text-red-200' : 'bg-red-200/70 text-red-700'}`}>
                        {v.size}: {v.stock}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  );
};

export default LowStockAlerts;
