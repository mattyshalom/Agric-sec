import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { farmService, FarmPayload } from '../services/farm.service';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Plus, MapPin, Layers, Sprout } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  areaHectares: z.coerce.number().min(0.01),
  country: z.string().min(2),
  region: z.string().min(1),
  soilType: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function FarmsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const farms = data?.data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FarmPayload) => farmService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farms'] });
      toast.success('Farm created!');
      setModalOpen(false);
      reset();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Farms</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your farm properties</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add Farm
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : farms.length === 0 ? (
        <div className="text-center py-16">
          <Sprout size={56} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-gray-600 font-medium">No farms yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add your first farm to get started.</p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add Farm
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm: { id: string; name: string; region: string; country: string; areaHectares: number; soilType?: string; _count?: { crops: number } }) => (
            <Link key={farm.id} to={`/farms/${farm.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Sprout size={20} className="text-primary-600" />
                  </div>
                  <Badge variant="green">{farm._count?.crops ?? 0} crops</Badge>
                </div>
                <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin size={13} /> {farm.region}, {farm.country}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Layers size={13} /> {farm.areaHectares} hectares
                    {farm.soilType && ` · ${farm.soilType}`}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Farm" size="lg">
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Input label="Farm name" error={errors.name?.message} {...register('name')} />
          <Input label="Description (optional)" {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="any" error={errors.latitude?.message} {...register('latitude')} />
            <Input label="Longitude" type="number" step="any" error={errors.longitude?.message} {...register('longitude')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Area (hectares)" type="number" step="0.01" error={errors.areaHectares?.message} {...register('areaHectares')} />
            <Input label="Soil type (optional)" {...register('soilType')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country code" placeholder="e.g. NG" error={errors.country?.message} {...register('country')} />
            <Input label="Region" error={errors.region?.message} {...register('region')} />
          </div>
          <Input label="Address (optional)" {...register('address')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Create Farm</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
