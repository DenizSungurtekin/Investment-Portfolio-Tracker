import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DASHBOARD_COLORS = {
  monthlyTrends: ['#0a63c9', 'rgba(149,112,185,0.77)','#FF9671', '#FF6F91','#9c26dc','#D65DB1'],
};

const InvestmentTypesEvolutionChart = ({ monthlyTypeData, formatCurrency, formatValue }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Investment Types Evolution</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyTypeData}
            margin={{ right: 30, left: 10 }}
          >
            <XAxis dataKey="date" />
            <YAxis
              tickFormatter={formatValue}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
            />
            <Legend />
            {Object.keys(monthlyTypeData[0] || {})
              .filter(key => key !== 'date')
              .map((type, index) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={DASHBOARD_COLORS.monthlyTrends[index % DASHBOARD_COLORS.monthlyTrends.length]}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

InvestmentTypesEvolutionChart.propTypes = {
  monthlyTypeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatValue: PropTypes.func.isRequired,
};

export default InvestmentTypesEvolutionChart;