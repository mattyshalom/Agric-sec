import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Sprout, Plus, ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColor = (s: string) =>
  ({ PLANNED: 'gray', PLANTED: 'blue', GROWING: 'green', HARVESTED: 'green', FAILED: 'red' }[s] || 'gray') as never;

export default function CropsPage() {
  const { farmId } = useParams<{ farmId: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', variety: '', plotAreaHectares: '', status: 'PLANNED',
    plantedAt: '', expectedHarvestAt: '', notes: '',
  });
  const qc = useQueryClient();

  const { data: cropsRes, isLoading } = useQuery({
    queryKey: ['crops', farmId],
    queryFn: () => api.get(`/farms/${farmId}/crops`),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post(`/farms/${farmId}/crops`, {
      ...form,
      plotAreaHectares: parseFloat(form.plotAreaHectares),
      plantedAt: form.plantedAt || undefined,
      expectedHarvestAt: form.expectedHarvestAt || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crops', farmId] });
      toast.success('Crop added');
      setModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (cropId: string) => api.delete(`/farms/${farmId}/crops/${cropId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crops', farmId] }),
  });

  const crops = cropsRes?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/farms/${farmId}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={20} /></Link>
        <div className="flex-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Crops</h1>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Crop</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : crops.length === 0 ? (
        <div className="text-center py-16">
          <Sprout size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No crops added yet.</p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}><Plus size={14} /> Add Crop</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crops.map((c: { id: string; name: string; variety?: string; status: string; plotAreaHectares: number; plantedAt?: string; expectedHarvestAt?: string; yieldKg?: number }) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg"><Sprout size={16} className="text-primary-600" /></div>
                  <div>
                    <p className="font-medium text-gray-900">{c.name} {c.variety && <span className="text-gray-400 text-sm">({c.variety})</span>}</p>
                    <p className="text-xs text-gray-500">{c.plotAreaHectares}ha</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColor(c.status)}>{c.status}</Badge>
                  <button onClick={() => deleteMutation.mutate(c.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                {c.plantedAt && <span>Planted: {format(new Date(c.plantedAt), 'MMM d, yyyy')}</span>}
                {c.expectedHarvestAt && <span>Expected harvest: {format(new Date(c.expectedHarvestAt), 'MMM d, yyyy')}</span>}
                {c.yieldKg && <span className="font-medium text-green-600">Yield: {c.yieldKg}kg</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Crop">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variety (optional)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plot area (ha)</label>
              <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.plotAreaHectares} onChange={(e) => setForm({ ...form, plotAreaHectares: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['PLANNED','PLANTED','GROWING','HARVESTED','FAILED'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planted date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.plantedAt} onChange={(e) => setForm({ ...form, plantedAt: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected harvest</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.expectedHarvestAt} onChange={(e) => setForm({ ...form, expectedHarvestAt: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Add Crop</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
