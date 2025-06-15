
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';

const StatisticsSection = ({ productsCount, inventoryValue, itemsSoldCount, salesFilterLabel, currencySymbol }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        type="totalProducts"
        value={productsCount}
        link={{ to: "/products", label: "Manage Products" }}
      />
      <StatCard
        type="inventoryValue"
        value={`${currencySymbol}${inventoryValue.toFixed(2)}`}
      />
      <StatCard
        type="itemsSold"
        value={itemsSoldCount}
        periodLabel={salesFilterLabel}
      />
    </div>
  );
};

export default StatisticsSection;
