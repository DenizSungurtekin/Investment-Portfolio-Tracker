import React from 'react';
import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DASHBOARD_COLORS = {
  monthlyTrends: ['#0a63c9', 'rgba(149,112,185,0.77)','#FF9671', '#FF6F91','#9c26dc','#D65DB1'],
};

const PortfolioEvolutionChart = ({ monthlyTotals, formatCurrency, formatValue }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Total Portfolio Evolution</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyTotals}
            margin={{ right: 30, left: 10 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(date) => date.toLocaleString('default', { month: 'short', year: 'numeric' })}
            />
            <YAxis
              tickFormatter={formatValue}
              width={50}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(date) => date.toLocaleString('default', { month: 'long', year: 'numeric' })}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={DASHBOARD_COLORS.monthlyTrends[0]}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

PortfolioEvolutionChart.propTypes = {
  monthlyTotals: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.instanceOf(Date).isRequired,
    total: PropTypes.number.isRequired,
  })).isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatValue: PropTypes.func.isRequired,
};

export default PortfolioEvolutionChart;