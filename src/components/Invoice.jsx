import React from 'react';
import { useShopSettings } from '@/contexts/ShopSettingsContext';

const Invoice = React.forwardRef(({ items, customerInfo, subtotal, tax, total, invoiceNumber, paymentMethod, paymentId }, ref) => {
  const { settings } = useShopSettings();
  const shopAddressLines = settings.address?.split(', ') || [];

  return (
    <div ref={ref} className={`p-4 font-mono text-xs bg-white text-black w-[80mm]`}>
      <div className="text-center mb-3">
        <h1 className="text-lg font-bold uppercase">{settings.shopName}</h1>
        {shopAddressLines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
        {settings.phone && <p>Phone: {settings.phone}</p>}
        {settings.email && <p>Email: {settings.email}</p>}
        {settings.gstNo && <p>GSTIN: {settings.gstNo}</p>}
        {Object.entries(settings.customFields || {}).length > 0 && (
        <>
          <div className="mb-2">
            {Object.entries(settings.customFields).map(([key, value]) => (
              <p key={key}>{key}: {value}</p>
            ))}
          </div>
        </>
      )}
      </div>

      <hr className="my-2 border-black border-dashed" />
      
      <div className="mb-2">
        <p>Invoice No: {invoiceNumber}</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>

      {customerInfo && (
        <div className="mb-2">
          <p>Customer: {customerInfo.name}</p>
          <p>Phone: {customerInfo.phone}</p>
          {customerInfo.email && <p>Email: {customerInfo.email}</p>}
        </div>
      )}
      
      <hr className="my-2 border-black border-dashed" />

      <table className="w-full mb-2">
        <thead>
          <tr>
            <th className="text-left w-[50%]">Item</th>
            <th className="text-center w-[15%]">Qty</th>
            <th className="text-right w-[15%]">Rate</th>
            <th className="text-right w-[20%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}{item.reference_number ? ` (${item.reference_number})` : ''}</td>
              <td className="text-center">{item.quantity}</td>
              <td className="text-right">{settings.currency.symbol}{item.price.toFixed(2)}</td>
              <td className="text-right">{settings.currency.symbol}{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="my-2 border-black border-dashed" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{settings.currency.symbol}{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount: ({(settings.taxRate * 100).toFixed(0)}%):</span>
          <span>-{settings.currency.symbol}{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm">
          <span>Grand Total:</span>
          <span>{settings.currency.symbol}{(subtotal - tax).toFixed(2)}</span>
        </div>
      </div>
      
      <hr className="my-2 border-black border-dashed" />

      <div className="mb-2">
        <p>Payment Method: {paymentMethod}</p>
        {paymentId && <p>Payment ID: {paymentId}</p>}
      </div>

      {settings.returnPolicy && (
        <>
          <hr className="my-2 border-black border-dashed" />
          <p>Return Policy:</p>
          <div className="text-center mt-2">
            <p className="text-xs">{settings.returnPolicy}</p>
          </div>
        </>
      )}
      
      <div className="text-center mt-3">
        <p>Thank you for your purchase!</p>
      </div>
    </div>
  );
});

Invoice.displayName = 'Invoice';
export default Invoice;