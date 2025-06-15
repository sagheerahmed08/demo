
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus } from 'lucide-react';

const CartDisplay = ({ cart, updateQuantity, removeFromCart, settings }) => {
  return (
    <div className="space-y-3">
      {cart.map((item) => (
        <div 
          key={item.cartKey} 
          className={`p-3 rounded-lg flex items-center justify-between transition-all
            ${settings.darkMode ? 'bg-gray-700/50 hover:bg-gray-600/60' : 'bg-gray-100 hover:bg-gray-200/70'}`}
        >
          <div className="flex-grow">
            <p className={`font-semibold ${settings.darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{item.name}</p>
            <p className={`text-xs ${settings.darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Ref: {item.reference_number} | Size: {item.size}
            </p>
            <p className={`text-xs ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {settings.currency.symbol}{item.price.toFixed(2)} x {item.quantity} = {settings.currency.symbol}{(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}>
              <Minus className="w-3 h-3" />
            </Button>
            <Input 
              type="number" 
              value={item.quantity} 
              onChange={(e) => updateQuantity(item.cartKey, parseInt(e.target.value) || 1)} 
              className="w-12 h-7 text-center p-1 dark:bg-gray-800"
              min="1"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30" onClick={() => removeFromCart(item.cartKey)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartDisplay;
