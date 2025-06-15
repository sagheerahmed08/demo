
import React from 'react';
import InfoTabs from '@/components/dashboard/InfoTabs';
import LowStockAlerts from '@/components/dashboard/LowStockAlerts';
import SoldItemsReport from '@/components/dashboard/SoldItemsReport';
import { useShopSettings } from '@/contexts/ShopSettingsContext';


const MainContentTabs = ({ 
  activeInfoTab, 
  setActiveInfoTab, 
  lowStockItems, 
  soldItems, 
  loadingSoldItems, 
  totalSalesValue, 
  salesFilter,
  setSalesFilter,
  customDate,
  setCustomDate,
  customMonth,
  setCustomMonth,
  customYear,
  setCustomYear,
}) => {
  const { settings } = useShopSettings();
  
  return (
    <div className={`rounded-xl p-6 ${settings.darkMode ? 'neumorphism-dark' : 'neumorphism'}`}>
      <InfoTabs
        activeInfoTab={activeInfoTab}
        setActiveInfoTab={setActiveInfoTab}
        lowStockItemsCount={lowStockItems.length}
        salesFilter={salesFilter}
        setSalesFilter={setSalesFilter}
        customDate={customDate}
        setCustomDate={setCustomDate}
        customMonth={customMonth}
        setCustomMonth={setCustomMonth}
        customYear={customYear}
        setCustomYear={setCustomYear}
      />
      
      {activeInfoTab === 'lowStock' && (
        <LowStockAlerts lowStockItems={lowStockItems} settings={settings} />
      )}

      {activeInfoTab === 'soldItems' && (
        <SoldItemsReport
          soldItems={soldItems}
          loadingSoldItems={loadingSoldItems}
          totalSalesValue={totalSalesValue}
          salesFilterLabel={salesFilter.label}
          settings={settings}
        />
      )}
    </div>
  );
};

export default MainContentTabs;
