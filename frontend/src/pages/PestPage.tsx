import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { pestService } from '../services/pest.service';
import { farmService } from '../services/farm.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Bug, Plus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const severityVariant = (s: string) =>
  s === 'CRITICAL' ? 'red' : s === 'WARNING' ? 'yellow' : 'blue';

export default function PestPage() {
  const [searchParams] = useSearchParams();
  const [selectedFarmId, setSelectedFarmId] = useState(searchParams.get('farmId') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    pestName: '', description: '', severity: 'WARNING', farmId: '',
    latitude: '', longitude: '',
  });
  const [images, setImages] = useState<FileList | null>(null);
  const qc = useQueryClient();

  const { data: farmsRes } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const farms = farmsRes?.data?.data ?? [];
  const activeFarmId = selectedFarmId || farms[0]?.id;

  const { data: reportsRes } = useQuery({
    queryKey: ['pest-reports', activeFarmId],
    queryFn: () => pestService.list({ farmId: activeFarmId, limit: '50' }),
    enabled: !!activeFarmId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries({ ...form, farmId: activeFarmId }).forEach(([k, v]) => fd.append(k, v));
      if (images) Array.from(images).forEach((f) => fd.append('images', f));
      return pestService.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pest-reports'] });
      toast.success('Report submitted');
      setModalOpen(false);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => pestService.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pest-reports'] }),
  });

  const reports = reportsRes?.data?.data ?? [];
  const open = reports.filter((r: { status: string }) => r.status === 'OPEN');
  const resolved = reports.filter((r: { status: string }) => r.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Pest & Disease</h1>
        <div className="flex gap-3">
          <select value={activeFarmId} onChange={(e) => setSelectedFarmId(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2">
            {farms.map((f: { id: string; name: string }) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Report
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3">
        <Badge variant="red">{open.length} Open</Badge>
        <Badge variant="green">{resolved.length} Resolved</Badge>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-16">
            <Bug size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No pest reports for this farm.</p>
          </div>
        ) : reports.map((r: { id: string; pestName: string; description: string; severity: string; status: string; createdAt: string; imageUrls: string[] }) => (
          <Card key={r.id} className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg shrink-0">
              <Bug size={18} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{r.pestName}</p>
                <Badge variant={severityVariant(r.severity)}>{r.severity}</Badge>
                <Badge variant={r.status === 'RESOLVED' ? 'green' : r.status === 'INVESTIGATING' ? 'yellow' : 'red'}>
                  {r.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{r.description}</p>
              <p className="text-xs text-gray-400 mt-1">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
              {r.imageUrls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-14 w-14 rounded object-cover border border-gray-200" />
                  ))}
                </div>
              )}
            </div>
            {r.status === 'OPEN' && (
              <Button size="sm" variant="secondary" onClick={() => resolveMutation.mutate(r.id)}>
                <CheckCircle size={14} /> Resolve
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Create report modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Report Pest / Disease">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pest / disease name</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.pestName} onChange={(e) => setForm({ ...form, pestName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label>
              <input type="number" step="any" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label>
              <input type="number" step="any" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images (up to 5)</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Submit Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
