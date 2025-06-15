
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; 
import { CreditCard, Landmark, Smartphone, IndianRupee } from 'lucide-react';

const PaymentOptions = ({ customerInfo, handleCustomerInfoChange, darkMode }) => {
  const paymentMethods = [

  ];

  return (
    <div className="mt-6">
      <Label className="text-base font-medium"></Label>
      <RadioGroup
        name="paymentMethod"
        value={customerInfo.paymentMethod}
        onValueChange={(value) => handleCustomerInfoChange({ target: { name: 'paymentMethod', value } })}
        className="mt-2 space-y-2"
      >
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Label
              key={method.value}
              htmlFor={`payment-${method.value}`}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all 
                ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-100/70'}
                ${customerInfo.paymentMethod === method.value ? (darkMode ? 'bg-gray-700 border-primary ring-1 ring-primary' : 'bg-primary/10 border-primary ring-1 ring-primary') : ''}`}
            >
              <RadioGroupItem value={method.value} id={`payment-${method.value}`} className="sr-only" />
              <Icon className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'} ${customerInfo.paymentMethod === method.value ? 'text-primary' : ''}`} />
              <span className={`font-medium ${customerInfo.paymentMethod === method.value ? (darkMode ? 'text-primary-foreground': 'text-primary') : ''}`}>{method.label}</span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default PaymentOptions;
