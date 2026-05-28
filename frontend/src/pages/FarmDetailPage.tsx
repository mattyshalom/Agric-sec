import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { farmService } from '../services/farm.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { Sprout, DollarSign, Bug, Droplets, ChevronLeft } from 'lucide-react';

export default function FarmDetailPage() {
  const { farmId } = useParams<{ farmId: string }>();

  const { data: farmRes, isLoading } = useQuery({
    queryKey: ['farm', farmId],
    queryFn: () => farmService.get(farmId!),
  });

  const { data: summaryRes } = useQuery({
    queryKey: ['farm-summary', farmId],
    queryFn: () => farmService.summary(farmId!),
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl" />;

  const farm = farmRes?.data?.data;
  const summary = summaryRes?.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/farms" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{farm?.name}</h1>
          <p className="text-sm text-gray-500">{farm?.region}, {farm?.country} · {farm?.areaHectares}ha</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Crops" value={summary?.cropCount ?? 0} icon={<Sprout size={18} className="text-primary-600" />} iconBg="bg-primary-100" />
        <StatCard title="Open Pest Reports" value={summary?.openPestReports ?? 0} icon={<Bug size={18} className="text-red-500" />} iconBg="bg-red-100" />
        <StatCard title="Resources" value={summary?.resourceCount ?? 0} icon={<Droplets size={18} className="text-blue-500" />} iconBg="bg-blue-100" />
        <StatCard title="Net Transactions" value={`$${(summary?.totalTransactionAmount ?? 0).toFixed(2)}`} icon={<DollarSign size={18} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm" className="flex flex-col items-center text-center gap-2 py-6">
          <Sprout size={32} className="text-primary-600" />
          <p className="font-medium text-gray-900">Manage Crops</p>
          <Link to={`/farms/${farmId}/crops`}>
            <Button size="sm" variant="secondary">View Crops</Button>
          </Link>
        </Card>
        <Card padding="sm" className="flex flex-col items-center text-center gap-2 py-6">
          <Bug size={32} className="text-red-500" />
          <p className="font-medium text-gray-900">Pest Reports</p>
          <Link to={`/pest?farmId=${farmId}`}>
            <Button size="sm" variant="secondary">View Reports</Button>
          </Link>
        </Card>
        <Card padding="sm" className="flex flex-col items-center text-center gap-2 py-6">
          <DollarSign size={32} className="text-green-600" />
          <p className="font-medium text-gray-900">Finances</p>
          <Link to={`/finance?farmId=${farmId}`}>
            <Button size="sm" variant="secondary">View Finance</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
