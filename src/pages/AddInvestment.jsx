import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const INVESTMENT_TYPES = [
  'cash',
  'bond',
  'stock',
  'real_estate',
  'commodity',
  'crypto'
];

function AddInvestment() {
  const navigate = useNavigate();
  const location = useLocation();
  const tableName = location.state?.tableName || 'investments';

  const [formData, setFormData] = useState({
    investment_name: '',  // Changed from name to match server expectations
    provider: '',
    investment_type: '',
    amount: '',
    currency: 'CHF',
    unit: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create payload with correct structure
    const payload = {
      name: formData.investment_name, // Server expects 'name'
      provider: formData.provider,
      investment_type: formData.investment_type,
      investment_name: formData.investment_name,
      amount: Number(formData.amount), // Ensure amount is a number
      currency: formData.currency,
      unit: formData.unit ? Number(formData.unit) : null, // Ensure unit is a number or null
      notes: formData.notes
    };

    try {
      const response = await fetch(`http://localhost:5000/api/investments/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error adding investment: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Add New Investment</h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Investment Name</label>
              <input
                type="text"
                name="investment_name"
                value={formData.investment_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Investment Type</label>
              <select
                name="investment_type"
                value={formData.investment_type}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select type...</option>
                {INVESTMENT_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit (optional)</label>
              <input
                type="number"
                step="0.0001"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows="3"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Investment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddInvestment;