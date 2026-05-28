import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmService } from '../services/farm.service';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Droplets, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
  WATER: 'blue', FERTILIZER: 'green', PESTICIDE: 'yellow',
  EQUIPMENT: 'gray', SEED: 'green', FUEL: 'red', OTHER: 'gray',
};

export default function ResourcesPage() {
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [useModal, setUseModal] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'WATER', unit: '', quantity: '', minQuantity: '' });
  const [useQty, setUseQty] = useState('');
  const qc = useQueryClient();

  const { data: farmsRes } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const farms = farmsRes?.data?.data ?? [];
  const activeFarmId = selectedFarmId || farms[0]?.id;

  const { data: resourcesRes } = useQuery({
    queryKey: ['resources', activeFarmId],
    queryFn: () => api.get('/resources', { params: { farmId: activeFarmId } }),
    enabled: !!activeFarmId,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/resources', {
      ...form, farmId: activeFarmId,
      quantity: parseFloat(form.quantity),
      minQuantity: parseFloat(form.minQuantity) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource added');
      setAddModal(false);
    },
  });

  const useMutation2 = useMutation({
    mutationFn: (resourceId: string) => api.post(`/resources/${resourceId}/usage`, {
      quantityUsed: parseFloat(useQty),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Usage logged');
      setUseModal(null);
      setUseQty('');
    },
  });

  const resources = resourcesRes?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
        <div className="flex gap-3">
          <select value={activeFarmId} onChange={(e) => setSelectedFarmId(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2">
            {farms.map((f: { id: string; name: string }) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <Button size="sm" onClick={() => setAddModal(true)}><Plus size={14} /> Add Resource</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Droplets size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No resources added yet.</p>
          </div>
        ) : resources.map((r: { id: string; name: string; type: string; quantity: number; minQuantity: number; unit: string }) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{r.name}</p>
                <Badge variant={(typeColors[r.type] || 'gray') as never} className="mt-1">{r.type}</Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{r.quantity}</p>
                <p className="text-xs text-gray-500">{r.unit}</p>
              </div>
            </div>
            {r.quantity <= r.minQuantity && r.minQuantity > 0 && (
              <p className="text-xs text-red-600 font-medium mb-2">Low stock alert</p>
            )}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div
                className="bg-primary-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, (r.quantity / Math.max(r.minQuantity * 2, 1)) * 100)}%` }}
              />
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => setUseModal(r.id)}>
              <Minus size={12} /> Log Usage
            </Button>
          </Card>
        ))}
      </div>

      {/* Add resource modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Resource">
        <div className="space-y-4">
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Unit (e.g. liters, kg)', key: 'unit', type: 'text' },
            { label: 'Initial quantity', key: 'quantity', type: 'number' },
            { label: 'Low-stock threshold', key: 'minQuantity', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {['WATER','FERTILIZER','PESTICIDE','EQUIPMENT','SEED','FUEL','OTHER'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Add</Button>
          </div>
        </div>
      </Modal>

      {/* Log usage modal */}
      <Modal isOpen={!!useModal} onClose={() => setUseModal(null)} title="Log Usage" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity used</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={useQty} onChange={(e) => setUseQty(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setUseModal(null)}>Cancel</Button>
            <Button loading={useMutation2.isPending} onClick={() => useModal && useMutation2.mutate(useModal)}>Log</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
