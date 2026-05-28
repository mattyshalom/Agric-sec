import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketService } from '../services/market.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MarketPage() {
  const [country, setCountry] = useState('NG');
  const [alertModal, setAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({ commodity: '', country: 'NG', targetPrice: '', condition: 'above' });
  const qc = useQueryClient();

  const { data: latestRes } = useQuery({
    queryKey: ['market-latest', country],
    queryFn: () => marketService.latestPrices(country),
  });

  const { data: alertsRes } = useQuery({
    queryKey: ['price-alerts'],
    queryFn: () => marketService.priceAlerts(),
  });

  const createAlert = useMutation({
    mutationFn: () => marketService.createPriceAlert({
      ...alertForm,
      targetPrice: parseFloat(alertForm.targetPrice),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-alerts'] });
      toast.success('Price alert created');
      setAlertModal(false);
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => marketService.deletePriceAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['price-alerts'] }),
  });

  const prices = latestRes?.data?.data ?? [];
  const alerts = alertsRes?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Market Prices</h1>
        <div className="flex gap-3">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="KE">Kenya</option>
            <option value="ZA">South Africa</option>
          </select>
          <Button size="sm" onClick={() => setAlertModal(true)}>
            <Plus size={14} /> Set Alert
          </Button>
        </div>
      </div>

      {/* Prices table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-600" /> Latest Commodity Prices
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Commodity', 'Market', 'Price/kg', 'Currency', 'Recorded'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prices.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No price data available.</td></tr>
              ) : prices.map((p: { commodity: string; market: string; pricePerKg: number; currency: string; recordedAt: string }, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">{p.commodity}</td>
                  <td className="px-4 py-3 text-gray-600">{p.market}</td>
                  <td className="px-4 py-3 font-semibold text-primary-700">{p.pricePerKg.toFixed(3)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.currency}</td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(p.recordedAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Price Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>My Price Alerts</CardTitle>
        </CardHeader>
        {alerts.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">No alerts set.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a: { id: string; commodity: string; condition: string; targetPrice: number; country: string }) => (
              <li key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 capitalize">{a.commodity}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {a.condition} {a.targetPrice}/kg · {a.country}
                  </span>
                </div>
                <button
                  onClick={() => deleteAlert.mutate(a.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Create alert modal */}
      <Modal isOpen={alertModal} onClose={() => setAlertModal(false)} title="Set Price Alert">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. maize"
              value={alertForm.commodity}
              onChange={(e) => setAlertForm({ ...alertForm, commodity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={alertForm.condition}
                onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target price/kg</label>
              <input
                type="number"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={alertForm.targetPrice}
                onChange={(e) => setAlertForm({ ...alertForm, targetPrice: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAlertModal(false)}>Cancel</Button>
            <Button loading={createAlert.isPending} onClick={() => createAlert.mutate()}>Create Alert</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
