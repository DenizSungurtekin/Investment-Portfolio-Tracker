import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

const PortfolioSummary = ({
  currentTotal,
  usableCash,
  percentageChange,
  usableCashPercentageChange,
  investmentCount,
  providerCount,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Total Portfolio Value</h2>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">
            {formatCurrency(currentTotal)}
          </p>
          {percentageChange !== null && (
            <span
              className={`flex items-center text-sm ${
                percentageChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {percentageChange >= 0 ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
              {Math.abs(percentageChange).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Usable Cash</h2>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(usableCash || 0)}
          </p>
          {usableCashPercentageChange !== null && (
            <span
              className={`flex items-center text-sm ${
                usableCashPercentageChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {usableCashPercentageChange >= 0 ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
              {Math.abs(usableCashPercentageChange).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Excluding VIAC - 3A and Pilier 2a</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Number of Investments</h2>
        <p className="text-3xl font-bold">
          {investmentCount}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Number of Providers</h2>
        <p className="text-3xl font-bold">
          {providerCount}
        </p>
      </div>
    </div>
  );
};

PortfolioSummary.propTypes = {
  currentTotal: PropTypes.number.isRequired,
  usableCash: PropTypes.number,
  percentageChange: PropTypes.number,
  usableCashPercentageChange: PropTypes.number,
  investmentCount: PropTypes.number.isRequired,
  providerCount: PropTypes.number.isRequired,
  formatCurrency: PropTypes.func.isRequired,
};

PortfolioSummary.defaultProps = {
  usableCash: 0,
  percentageChange: null,
  usableCashPercentageChange: null,
};

export default PortfolioSummary;