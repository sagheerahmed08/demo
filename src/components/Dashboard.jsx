
import React, { useState, useEffect, useCallback } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useShopSettings } from '@/contexts/ShopSettingsContext';
import { supabase } from '@/lib/supabase';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatisticsSection from '@/components/dashboard/StatisticsSection';
import MainContentTabs from '@/components/dashboard/MainContentTabs';
import { getStartAndEndDatesForFilter } from '@/utils/dateUtils';

const Dashboard = () => {
  const { products } = useProducts();
  const { settings } = useShopSettings();
  
  const [soldItems, setSoldItems] = useState([]);
  const [loadingSoldItems, setLoadingSoldItems] = useState(false);
  
  const [salesFilter, setSalesFilter] = useState({ type: 'today', label: 'Today' });
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customMonth, setCustomMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [customYear, setCustomYear] = useState(new Date().getFullYear().toString());
  
  const [activeInfoTab, setActiveInfoTab] = useState('lowStock');
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [itemsSoldCount, setItemsSoldCount] = useState(0);

  const lowStockItems = products.filter(product => 
    (product.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0) < 10
  );
  
  const totalInventoryValue = products.reduce((sum, product) => {
    const productStockValue = product.product_variants?.reduce((variantSum, variant) => variantSum + (product.price * variant.stock), 0) || 0;
    return sum + productStockValue;
  }, 0);


  const fetchSoldItems = useCallback(async () => {
    setLoadingSoldItems(true);
    
    const { startDate, endDate } = getStartAndEndDatesForFilter(salesFilter.type, {
        customDate,
        customMonth,
        customYear
    });

    let query = supabase
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        size, 
        products (name, reference_number),
        sales!inner (created_at)
      `);
    
    if (startDate && endDate) {
      query = query.filter('sales.created_at', 'gte', startDate.toISOString())
                   .filter('sales.created_at', 'lte', endDate.toISOString());
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sold items:", error);
      setSoldItems([]);
      setTotalSalesValue(0);
      setItemsSoldCount(0);
    } else {
      const aggregatedItems = data.reduce((acc, item) => {
        if (!item.products) { return acc; } 
        const key = `${item.products.reference_number || item.products.name}-${item.size || 'N/A'}`;
        if (!acc[key]) {
          acc[key] = { 
            name: item.products.name, 
            ref: item.products.reference_number, 
            size: item.size || 'N/A',
            quantity: 0, 
            totalValue: 0 
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].totalValue += item.quantity * item.unit_price;
        return acc;
      }, {});
      const currentSoldItems = Object.values(aggregatedItems);
      setSoldItems(currentSoldItems);
      setTotalSalesValue(currentSoldItems.reduce((sum, item) => sum + item.totalValue, 0));
      setItemsSoldCount(currentSoldItems.reduce((sum, item) => sum + item.quantity, 0));
    }
    setLoadingSoldItems(false);
  }, [salesFilter, customDate, customMonth, customYear]);

  useEffect(() => {
    fetchSoldItems();
  }, [fetchSoldItems]);
  
  return (
    <div className="space-y-8">
      <DashboardHeader />
      <StatisticsSection 
        productsCount={products.length}
        inventoryValue={totalInventoryValue}
        itemsSoldCount={itemsSoldCount}
        salesFilterLabel={salesFilter.label}
        currencySymbol={settings.currency.symbol}
      />
      <MainContentTabs
        activeInfoTab={activeInfoTab}
        setActiveInfoTab={setActiveInfoTab}
        lowStockItems={lowStockItems}
        soldItems={soldItems}
        loadingSoldItems={loadingSoldItems}
        totalSalesValue={totalSalesValue}
        salesFilter={salesFilter}
        setSalesFilter={setSalesFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
        customMonth={customMonth}
        setCustomMonth={setCustomMonth}
        customYear={customYear}
        setCustomYear={setCustomYear}
        settings={settings}
      />
    </div>
  );
};

export default Dashboard;
