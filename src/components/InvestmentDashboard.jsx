import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import PortfolioSummary from './PortfolioSummary';
import AssetAllocationChart from './AssetAllocationChart';
import ProviderDistributionChart from './ProviderDistributionChart';
import PortfolioEvolutionChart from './PortfolioEvolutionChart';
import InvestmentTypesEvolutionChart from './InvestmentTypesEvolutionChart';
import InvestmentTable from './InvestmentTable';
import { formatValue, formatCurrency, formatMonthDisplay, parseDate } from './utils';

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

  // Calculate usable cash (excluding VIAC - 3A and Pilier 2a)
  const usableCash = useMemo(() => {
    if (!latestMonthData || latestMonthData.length === 0) {
      return 0;
    }

    console.log('Calculating usableCash with data:', latestMonthData.map(inv => ({
      name: inv.investment_name,
      amount: inv.amount
    })));

    const filtered = latestMonthData.filter(inv =>
      inv.investment_name !== 'VIAC - 3A' &&
      inv.investment_name !== 'Pillier 2a'
    );

    console.log('Filtered investments:', filtered.length, 'out of', latestMonthData.length);

    const total = filtered.reduce((sum, inv) => {
      const amount = Number(inv.amount || 0);
      console.log('Adding amount:', amount, 'from', inv.investment_name);
      return sum + amount;
    }, 0);

    console.log('Usable cash total:', total);
    return total;
  }, [latestMonthData]);

  const previousUsableCash = useMemo(() => {
    const previousKey = sortedMonthKeys[sortedMonthKeys.length - 2];
    if (!previousKey || !groupedInvestments[previousKey]) {
      return 0;
    }

    const previousMonthData = groupedInvestments[previousKey];
    return previousMonthData
      .filter(inv =>
        inv.investment_name !== 'VIAC - 3A' &&
        inv.investment_name !== 'Pilier 2a'
      )
      .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  }, [groupedInvestments, sortedMonthKeys]);

  const usableCashPercentageChange = useMemo(() => {
    if (!previousUsableCash || previousUsableCash === 0) {
      return null;
    }
    return ((usableCash - previousUsableCash) / previousUsableCash) * 100;
  }, [usableCash, previousUsableCash]);

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

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
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
        <PortfolioSummary
          currentTotal={currentTotal}
          usableCash={usableCash}
          percentageChange={percentageChange}
          usableCashPercentageChange={usableCashPercentageChange}
          investmentCount={latestMonthData.length}
          providerCount={new Set(latestMonthData.map(inv => inv.provider)).size}
          formatCurrency={formatCurrency}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AssetAllocationChart
            typeData={typeData}
            selectedMonth={selectedMonthAllocation}
            onMonthChange={setSelectedMonthAllocation}
            sortedMonthKeys={sortedMonthKeys}
            formatMonthDisplay={formatMonthDisplay}
            formatCurrency={formatCurrency}
          />

          <ProviderDistributionChart
            providerData={providerData}
            selectedMonth={selectedMonthProvider}
            onMonthChange={setSelectedMonthProvider}
            sortedMonthKeys={sortedMonthKeys}
            formatMonthDisplay={formatMonthDisplay}
            formatCurrency={formatCurrency}
            formatValue={formatValue}
          />
        </div>

        {/* Monthly Evolution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PortfolioEvolutionChart
            monthlyTotals={monthlyTotals}
            formatCurrency={formatCurrency}
            formatValue={formatValue}
          />

          <InvestmentTypesEvolutionChart
            monthlyTypeData={monthlyTypeData}
            formatCurrency={formatCurrency}
            formatValue={formatValue}
          />
        </div>

        {/* Current Month Investment Details */}
        <InvestmentTable
          investments={currentMonthData}
          title={`Investment Details: ${formatMonthDisplay(currentMonthKey)}`}
          editingId={editingId}
          editData={editData}
          onEdit={handleEdit}
          onEditChange={handleEditChange}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          formatCurrency={formatCurrency}
          formatMonthDisplay={formatMonthDisplay}
          showDuplicateOnly={false}
        />

        {/* Previous Month Investment Details */}
        <InvestmentTable
          investments={prevMonthData}
          title={`Previous Month Investment Details: ${formatMonthDisplay(prevMonthKey)}`}
          editingId={null}
          editData={null}
          onEdit={() => {}}
          onEditChange={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
          onDelete={() => {}}
          onDuplicate={handleDuplicate}
          formatCurrency={formatCurrency}
          formatMonthDisplay={formatMonthDisplay}
          showDuplicateOnly={true}
        />
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