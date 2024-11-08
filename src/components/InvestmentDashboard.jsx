import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, Pencil, Trash2, X, Check, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const DASHBOARD_COLORS = {
  allocation: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'],
  providers: ['#845EC2', '#D65DB1', '#FF6F91', '#FF9671', '#FFC75F', '#F9F871'],
  monthlyTrends: ['#0a63c9', 'rgba(149,112,185,0.77)','#FF9671', '#FF6F91','#9c26dc','#D65DB1'],
  positive: '#4CAF50',
  negative: '#FF5252',
};

const INVESTMENT_TYPES = [
  'cash',
  'bond',
  'stock',
  'real_estate',
  'commodity',
  'crypto'
];

const InvestmentDashboard = ({
  investments,
  selectedTable,
  onUpdateInvestment,
  onDeleteInvestment,
  onDuplicateInvestment
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [selectedMonthAllocation, setSelectedMonthAllocation] = useState(null);
  const [selectedMonthProvider, setSelectedMonthProvider] = useState(null);

  // Get current date for comparison
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

// Formatting functions
  const formatValue = (value) => {
    return new Intl.NumberFormat('fr-CH', {
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(value);
  };

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return new Date(year, Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Helper function to parse PostgreSQL timestamp
  const parseDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      date: date
    };
  };

  // Group investments by month and year
  const groupedInvestments = useMemo(() => {
    return investments.reduce((acc, inv) => {
      const { key } = parseDate(inv.created_at);
      if (!acc[key]) acc[key] = [];
      acc[key].push(inv);
      return acc;
    }, {});
  }, [investments]);

  // Sort months chronologically
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(groupedInvestments).sort();
  }, [groupedInvestments]);

  // Get the latest month with data
  const latestMonthKey = useMemo(() => {
    return sortedMonthKeys[sortedMonthKeys.length - 1];
  }, [sortedMonthKeys]);

  // Get latest month's data for portfolio metrics
  const latestMonthData = useMemo(() => {
    return groupedInvestments[latestMonthKey] || [];
  }, [groupedInvestments, latestMonthKey]);

  // Add selected month data computations here (FIXED ORDER)
  const selectedMonthAllocationData = useMemo(() => {
    if (!selectedMonthAllocation || !groupedInvestments[selectedMonthAllocation]) {
      return [];
    }
    return groupedInvestments[selectedMonthAllocation];
  }, [groupedInvestments, selectedMonthAllocation]);

  const selectedMonthProviderData = useMemo(() => {
    if (!selectedMonthProvider || !groupedInvestments[selectedMonthProvider]) {
      return [];
    }
    return groupedInvestments[selectedMonthProvider];
  }, [groupedInvestments, selectedMonthProvider]);

  // Get current month's data (might be empty)
  const currentMonthData = useMemo(() => {
    return groupedInvestments[currentMonthKey] || [];
  }, [groupedInvestments, currentMonthKey]);

  // Get previous month's data relative to current month
  const prevMonthKey = useMemo(() => {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }, [currentDate]);

  const prevMonthData = useMemo(() => {
    return groupedInvestments[prevMonthKey] || [];
  }, [groupedInvestments, prevMonthKey]);

  // Calculate totals using latest month data
  const currentTotal = useMemo(() => {
    return latestMonthData.reduce((sum, inv) => sum + Number(inv.amount), 0);
  }, [latestMonthData]);

  const previousTotal = useMemo(() => {
    const previousKey = sortedMonthKeys[sortedMonthKeys.length - 2];
    const previousMonthData = previousKey ? groupedInvestments[previousKey] : [];
    return previousMonthData.reduce((sum, inv) => sum + Number(inv.amount), 0);
  }, [groupedInvestments, sortedMonthKeys]);

  const percentageChange = useMemo(() => {
    return previousTotal ? ((currentTotal - previousTotal) / previousTotal) * 100 : null;
  }, [currentTotal, previousTotal]);

// Update selected months when month keys change
  useEffect(() => {
    if (latestMonthKey) {
      setSelectedMonthAllocation(prevMonth => prevMonth || latestMonthKey);
      setSelectedMonthProvider(prevMonth => prevMonth || latestMonthKey);
    }
  }, [latestMonthKey]);

  // Prepare data for allocation pie chart
  const typeData = useMemo(() => {
    return Object.entries(
      selectedMonthAllocationData.reduce((acc, inv) => {
        acc[inv.investment_type] = (acc[inv.investment_type] || 0) + Number(inv.amount);
        return acc;
      }, {})
    )
      .map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedMonthAllocationData]);

  // Prepare data for provider bar chart
  const providerData = useMemo(() => {
    return Object.entries(
      selectedMonthProviderData.reduce((acc, inv) => {
        acc[inv.provider] = (acc[inv.provider] || 0) + Number(inv.amount);
        return acc;
      }, {})
    )
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedMonthProviderData]);

  // Calculate monthly totals for trend analysis
  const monthlyTotals = useMemo(() => {
    return Object.entries(groupedInvestments).map(([key, invs]) => {
      const [year, month] = key.split('-');
      const date = new Date(year, Number(month) - 1);
      return {
        date: date,
        total: invs.reduce((sum, inv) => sum + Number(inv.amount), 0),
      };
    }).sort((a, b) => a.date - b.date);
  }, [groupedInvestments]);

  const monthlyTypeData = useMemo(() => {
    return sortedMonthKeys.map(key => {
      const invs = groupedInvestments[key];
      const [year, month] = key.split('-');
      const date = new Date(year, Number(month) - 1);

      const types = invs.reduce((acc, inv) => {
        acc[inv.investment_type] = (acc[inv.investment_type] || 0) + Number(inv.amount);
        return acc;
      }, {});

      return {
        date: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        ...types
      };
    });
  }, [sortedMonthKeys, groupedInvestments]);

  // Event handlers
  const handleEdit = (investment) => {
    setEditingId(investment.investment_id);
    setEditData({ ...investment });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const success = await onUpdateInvestment(editData);
      if (success) {
        setEditingId(null);
        setEditData(null);
      } else {
        alert('Failed to update investment');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error updating investment: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this investment?')) {
      return;
    }

    try {
      const success = await onDeleteInvestment(id);
      if (!success) {
        alert('Failed to delete investment');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting investment: ' + error.message);
    }
  };

  const handleDuplicate = async (investment) => {
    try {
      const newInvestment = {
        name: investment.investment_name,
        investment_name: investment.investment_name,
        investment_type: investment.investment_type,
        provider: investment.provider,
        amount: Number(investment.amount),
        currency: investment.currency || 'CHF',
        unit: investment.unit ? Number(investment.unit) : null,
        notes: investment.notes || ''
      };

      const success = await onDuplicateInvestment(newInvestment);
      if (!success) {
        alert('Failed to duplicate investment');
      }
    } catch (error) {
      console.error('Duplication error:', error);
      alert('Error duplicating investment: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <h2 className="text-lg font-semibold mb-2">Number of Investments</h2>
            <p className="text-3xl font-bold">
              {latestMonthData.length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Number of Providers</h2>
            <p className="text-3xl font-bold">
              {new Set(latestMonthData.map(inv => inv.provider)).size}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Asset Allocation Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Asset Allocation</h2>
              <div className="w-48">
                <Select
                  value={selectedMonthAllocation}
                  onValueChange={setSelectedMonthAllocation}
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
{/* Provider Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Provider Distribution</h2>
              <div className="w-48">
                <Select
                  value={selectedMonthProvider}
                  onValueChange={setSelectedMonthProvider}
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
        </div>

        {/* Monthly Evolution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

      {/* Current Month Investment Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Investment Details: {formatMonthDisplay(currentMonthKey)}
          </h2>
          {currentMonthData.length > 0 ? (
            <div className="overflow-y-auto" style={{maxHeight: '300px'}}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-left p-2 font-semibold">Provider</th>
                    <th className="text-right p-2 font-semibold">Amount</th>
                    <th className="text-left p-2 font-semibold">Notes</th>
                    <th className="text-right p-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthData
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((investment) => (
                      <tr key={investment.investment_id} className="border-b hover:bg-gray-50">
                        {editingId === investment.investment_id ? (
                          // Edit mode
                          <>
                            <td className="p-2">
                              <input
                                type="text"
                                name="investment_name"
                                value={editData?.investment_name || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                name="investment_type"
                                value={editData?.investment_type || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded"
                              >
                                {INVESTMENT_TYPES.map(type => (
                                  <option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="provider"
                                value={editData?.provider || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                name="amount"
                                value={editData?.amount || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                name="notes"
                                value={editData?.notes || ''}
                                onChange={handleEditChange}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={handleSave}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Save"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditData(null);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800"
                                  title="Cancel"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          // View mode
                          <>
                            <td className="p-2">{investment.investment_name}</td>
                            <td className="p-2 capitalize">{investment.investment_type.replace('_', ' ')}</td>
                            <td className="p-2">{investment.provider}</td>
                            <td className="text-right p-2">
                              {formatCurrency(investment.amount)}
                            </td>
                            <td className="p-2 text-gray-600 text-sm">{investment.notes || '-'}</td>
                            <td className="p-2 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(investment)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(investment.investment_id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No investments recorded for the current month yet
            </div>
          )}
        </div>

        {/* Previous Month Investment Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Previous Month Investment Details: {formatMonthDisplay(prevMonthKey)}
          </h2>
          {prevMonthData.length > 0 ? (
            <div className="overflow-y-auto" style={{maxHeight: '300px'}}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-left p-2 font-semibold">Provider</th>
                    <th className="text-right p-2 font-semibold">Amount</th>
                    <th className="text-left p-2 font-semibold">Notes</th>
                    <th className="text-right p-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prevMonthData
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((investment) => (
                      <tr key={investment.investment_id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{investment.investment_name}</td>
                        <td className="p-2 capitalize">{investment.investment_type.replace('_', ' ')}</td>
                        <td className="p-2">{investment.provider}</td>
                        <td className="text-right p-2">
                          {formatCurrency(investment.amount)}
                        </td>
                        <td className="p-2 text-gray-600 text-sm">{investment.notes || '-'}</td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => handleDuplicate(investment)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Duplicate for current month"
                          >
                            <Copy size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No investments found for the previous month
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

InvestmentDashboard.propTypes = {
  investments: PropTypes.arrayOf(PropTypes.shape({
    investment_id: PropTypes.number.isRequired,
    investment_name: PropTypes.string.isRequired,
    investment_type: PropTypes.string.isRequired,
    provider: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    notes: PropTypes.string,
    currency: PropTypes.string,
    created_at: PropTypes.string.isRequired,
  })).isRequired,
  selectedTable: PropTypes.string.isRequired,
  onUpdateInvestment: PropTypes.func.isRequired,
  onDeleteInvestment: PropTypes.func.isRequired,
  onDuplicateInvestment: PropTypes.func.isRequired,
};

export default InvestmentDashboard;

