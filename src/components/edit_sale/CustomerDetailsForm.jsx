
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CustomerDetailsForm = ({ customerInfo, onCustomerInfoChange, darkMode }) => {
  return (
    <fieldset className={`grid md:grid-cols-2 gap-6 border p-4 rounded-md ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <legend className="text-lg font-semibold px-1">Customer Details</legend>
      <div>
        <Label htmlFor="customerName">Name</Label>
        <Input 
          id="customerName" 
          name="name" 
          value={customerInfo.name} 
          onChange={onCustomerInfoChange} 
          required 
          className={darkMode ? 'border-gray-700' : ''}
        />
      </div>
      <div>
        <Label htmlFor="customerPhone">Phone</Label>
        <Input 
          id="customerPhone" 
          name="phone" 
          value={customerInfo.phone} 
          onChange={onCustomerInfoChange} 
          required 
          className={darkMode ? 'border-gray-700' : ''}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="customerEmail">Email (Optional)</Label>
        <Input 
          id="customerEmail" 
          name="email" 
          type="email" 
          value={customerInfo.email} 
          onChange={onCustomerInfoChange}
          className={darkMode ? 'border-gray-700' : ''}
        />
      </div>
    </fieldset>
  );
};

export default CustomerDetailsForm;
