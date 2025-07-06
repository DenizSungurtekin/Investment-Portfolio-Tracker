import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const DASHBOARD_COLORS = {
  providers: ['#845EC2', '#D65DB1', '#FF6F91', '#FF9671', '#FFC75F', '#F9F871'],
};

const ProviderDistributionChart = ({
  providerData,
  selectedMonth,
  onMonthChange,
  sortedMonthKeys,
  formatMonthDisplay,
  formatCurrency,
  formatValue
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Provider Distribution</h2>
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
          <BarChart
            data={providerData}
            margin={{ right: 30, left: 10 }}
          >
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={formatValue}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
            />
            <Bar dataKey="value">
              {providerData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={DASHBOARD_COLORS.providers[index % DASHBOARD_COLORS.providers.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

ProviderDistributionChart.propTypes = {
  providerData: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
  })).isRequired,
  selectedMonth: PropTypes.string,
  onMonthChange: PropTypes.func.isRequired,
  sortedMonthKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
  formatMonthDisplay: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatValue: PropTypes.func.isRequired,
};

export default ProviderDistributionChart;