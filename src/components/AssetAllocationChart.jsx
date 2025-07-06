import React from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const DASHBOARD_COLORS = {
  allocation: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'],
};

const AssetAllocationChart = ({
  typeData,
  selectedMonth,
  onMonthChange,
  sortedMonthKeys,
  formatMonthDisplay,
  formatCurrency
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Asset Allocation</h2>
        <div className="w-48">
          <Select
            value={selectedMonth}
            onValueChange={onMonthChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {sortedMonthKeys.map((monthKey) => (
                <SelectItem key={monthKey} value={monthKey}>
                  {formatMonthDisplay(monthKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={typeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
              }
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DASHBOARD_COLORS.allocation[index % DASHBOARD_COLORS.allocation.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

AssetAllocationChart.propTypes = {
  typeData: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,
  selectedMonth: PropTypes.string,
  onMonthChange: PropTypes.func.isRequired,
  sortedMonthKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  formatMonthDisplay: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

export default AssetAllocationChart;