import React from 'react';
import PropTypes from 'prop-types';
import { Pencil, Trash2, Copy, Check, X } from 'lucide-react';

const INVESTMENT_TYPES = [
  'cash',
  'bond',
  'stock',
  'real_estate',
  'commodity',
  'crypto'
];

const InvestmentTable = ({
  investments,
  title,
  editingId,
  editData,
  onEdit,
  onEditChange,
  onSave,
  onCancel,
  onDelete,
  onDuplicate,
  formatCurrency,
  formatMonthDisplay,
  showDuplicateOnly = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {investments.length > 0 ? (
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
              {investments
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
                            onChange={onEditChange}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            name="investment_type"
                            value={editData?.investment_type || ''}
                            onChange={onEditChange}
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
                            onChange={onEditChange}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            name="amount"
                            value={editData?.amount || ''}
                            onChange={onEditChange}
                            className="w-full px-2 py-1 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            name="notes"
                            value={editData?.notes || ''}
                            onChange={onEditChange}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={onSave}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={onCancel}
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
                            {showDuplicateOnly ? (
                              <button
                                onClick={() => onDuplicate(investment)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Duplicate for current month"
                              >
                                <Copy size={16} />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => onEdit(investment)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => onDelete(investment.investment_id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
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
          No investments found for this period
        </div>
      )}
    </div>
  );
};

InvestmentTable.propTypes = {
  investments: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired,
  editingId: PropTypes.number,
  editData: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onEditChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  formatMonthDisplay: PropTypes.func.isRequired,
  showDuplicateOnly: PropTypes.bool,
};

export default InvestmentTable;