import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { financeService } from '../services/finance.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Plus, DollarSign, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function FinancePage() {
  const [searchParams] = useSearchParams();
  const [selectedFarmId, setSelectedFarmId] = useState(searchParams.get('farmId') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'EXPENSE', category: '', amount: '', description: '', transactedAt: new Date().toISOString().slice(0, 10),
  });
  const qc = useQueryClient();

  const { data: farmsRes } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const farms = farmsRes?.data?.data ?? [];
  const activeFarmId = selectedFarmId || farms[0]?.id;

  const { data: summaryRes } = useQuery({
    queryKey: ['finance-summary', activeFarmId],
    queryFn: () => financeService.summary(activeFarmId, new Date().getFullYear()),
    enabled: !!activeFarmId,
  });

  const { data: txRes } = useQuery({
    queryKey: ['transactions', activeFarmId],
    queryFn: () => financeService.transactions({ farmId: activeFarmId, limit: '50' }),
    enabled: !!activeFarmId,
  });

  const createMutation = useMutation({
    mutationFn: () => financeService.createTransaction({
      ...form, farmId: activeFarmId, amount: parseFloat(form.amount),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', activeFarmId] });
      qc.invalidateQueries({ queryKey: ['finance-summary', activeFarmId] });
      toast.success('Transaction added');
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeService.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', activeFarmId] });
      qc.invalidateQueries({ queryKey: ['finance-summary', activeFarmId] });
    },
  });

  const summary = summaryRes?.data?.data;
  const transactions = txRes?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Financial Tracking</h1>
        <div className="flex gap-3">
          <select
            value={activeFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2"
          >
            {farms.map((f: { id: string; name: string }) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Income" value={`$${(summary?.totalIncome ?? 0).toFixed(2)}`} icon={<TrendingUp size={18} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Total Expenses" value={`$${(summary?.totalExpense ?? 0).toFixed(2)}`} icon={<TrendingDown size={18} className="text-red-500" />} iconBg="bg-red-100" />
        <StatCard title="Net Profit" value={`$${(summary?.netProfit ?? 0).toFixed(2)}`} icon={<DollarSign size={18} className="text-primary-600" />} iconBg="bg-primary-100" />
      </div>

      {/* Transactions table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Transactions ({new Date().getFullYear()})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Type', 'Category', 'Description', 'Amount', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No transactions yet.</td></tr>
              ) : transactions.map((tx: { id: string; transactedAt: string; type: string; category: string; description: string; amount: number; currency: string }) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{format(new Date(tx.transactedAt), 'MMM d')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tx.type === 'INCOME' ? 'green' : 'red'}>{tx.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{tx.category}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.description}</td>
                  <td className={`px-4 py-3 font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{tx.currency} {tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteMutation.mutate(tx.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add transaction modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Transaction">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. seed purchase"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form.transactedAt}
                onChange={(e) => setForm({ ...form, transactedAt: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
