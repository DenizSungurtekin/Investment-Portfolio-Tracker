import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import InvestmentDashboard from './components/InvestmentDashboard';
import AddInvestment from './pages/AddInvestment';
import { Plus } from 'lucide-react';

function DashboardContent({ data, loading, error, selectedTable, setSelectedTable, handleAddNew }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Investment Portfolio Dashboard</h1>
            <div className="flex items-center gap-4">
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="investments">Investments</option>
                <option value="investments_fake">Investments (Fake)</option>
              </select>
              <button
                onClick={handleAddNew}
                className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Add New Investment"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>
        <InvestmentDashboard investments={data} selectedTable={selectedTable} />
      </div>
    </div>
  );
}

DashboardContent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      investment_id: PropTypes.number.isRequired,
      investment_name: PropTypes.string.isRequired,
      investment_type: PropTypes.string.isRequired,
      provider: PropTypes.string.isRequired,
      amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      notes: PropTypes.string,
      currency: PropTypes.string.isRequired,
      created_at: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  selectedTable: PropTypes.string.isRequired,
  setSelectedTable: PropTypes.func.isRequired,
  handleAddNew: PropTypes.func.isRequired,
};

DashboardContent.defaultProps = {
  data: null,
  error: null,
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedTable, setSelectedTable] = useState('investments_fake');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/investments/${selectedTable}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/') {
      fetchData();
    }
  }, [location.pathname, selectedTable]);

  const handleAddNew = () => {
    navigate('/add-investment', { state: { tableName: selectedTable } });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardContent
            data={data}
            loading={loading}
            error={error}
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            handleAddNew={handleAddNew}
          />
        }
      />
      <Route path="/add-investment" element={<AddInvestment />} />
    </Routes>
  );
}

export default App;