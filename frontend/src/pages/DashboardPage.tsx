import { useQuery } from '@tanstack/react-query';
import { farmService } from '../services/farm.service';
import { weatherService } from '../services/weather.service';
import { communityService } from '../services/community.service';
import { useAuthStore } from '../store/authStore';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Sprout, CloudSun, Bug, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: farmsRes } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const { data: alertsRes } = useQuery({ queryKey: ['weather-alerts'], queryFn: () => weatherService.alerts() });
  const { data: notifsRes } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => communityService.notifications(true),
  });

  const farms = farmsRes?.data?.data ?? [];
  const alerts = alertsRes?.data?.data ?? [];
  const notifications = notifsRes?.data?.data ?? [];

  const unreadAlerts = alerts.filter((a: { isRead: boolean }) => !a.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.firstName}
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening across your farms today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Farms"
          value={farms.length}
          icon={<Sprout size={20} className="text-primary-600" />}
          iconBg="bg-primary-100"
        />
        <StatCard
          title="Weather Alerts"
          value={unreadAlerts.length}
          subtitle="Unread"
          icon={<CloudSun size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Notifications"
          value={notifications.length}
          subtitle="Unread"
          icon={<Bell size={20} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
        />
        <StatCard
          title="Active Crops"
          value={farms.reduce((acc: number, f: { _count?: { crops: number } }) => acc + (f._count?.crops ?? 0), 0)}
          icon={<Bug size={20} className="text-green-600" />}
          iconBg="bg-green-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farms quick view */}
        <Card>
          <CardHeader>
            <CardTitle>My Farms</CardTitle>
            <Link to="/farms" className="text-sm text-primary-600 hover:underline">View all</Link>
          </CardHeader>
          {farms.length === 0 ? (
            <div className="text-center py-8">
              <Sprout size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No farms yet.</p>
              <Link to="/farms" className="mt-2 inline-block text-sm text-primary-600 font-medium hover:underline">
                Add your first farm
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {farms.slice(0, 5).map((farm: { id: string; name: string; region: string; areaHectares: number; _count?: { crops: number } }) => (
                <li key={farm.id} className="py-3">
                  <Link to={`/farms/${farm.id}`} className="flex items-center justify-between hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{farm.name}</p>
                      <p className="text-xs text-gray-500">{farm.region} · {farm.areaHectares}ha</p>
                    </div>
                    <Badge variant="green">{farm._count?.crops ?? 0} crops</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Weather alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Weather Alerts</CardTitle>
            <Link to="/weather" className="text-sm text-primary-600 hover:underline">View all</Link>
          </CardHeader>
          {unreadAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CloudSun size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No active weather alerts.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {unreadAlerts.slice(0, 4).map((a: { id: string; title: string; message: string; severity: string; triggeredAt: string }) => (
                <li key={a.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(a.triggeredAt), { addSuffix: true })}</p>
                  </div>
                  <Badge variant={a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'yellow' : 'blue'}>
                    {a.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
