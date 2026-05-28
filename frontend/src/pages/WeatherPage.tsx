import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmService } from '../services/farm.service';
import { weatherService } from '../services/weather.service';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CloudSun, Thermometer, Droplets, Wind, RefreshCw, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function WeatherPage() {
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const qc = useQueryClient();

  const { data: farmsRes } = useQuery({ queryKey: ['farms'], queryFn: () => farmService.list() });
  const farms = farmsRes?.data?.data ?? [];

  const activeFarmId = selectedFarmId || farms[0]?.id;

  const { data: logsRes, isLoading: logsLoading } = useQuery({
    queryKey: ['weather-logs', activeFarmId],
    queryFn: () => weatherService.logs(activeFarmId, 3),
    enabled: !!activeFarmId,
  });

  const { data: alertsRes } = useQuery({
    queryKey: ['weather-alerts'],
    queryFn: () => weatherService.alerts(),
  });

  const refreshMutation = useMutation({
    mutationFn: () => weatherService.forecast(activeFarmId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weather-logs', activeFarmId] });
      qc.invalidateQueries({ queryKey: ['weather-alerts'] });
      toast.success('Weather data refreshed');
    },
  });

  const logs = logsRes?.data?.data ?? [];
  const alerts = alertsRes?.data?.data ?? [];
  const latest = logs[0];

  const chartData = [...logs].reverse().map((l: { recordedAt: string; temperatureC: number; rainfallMm: number; humidity: number }) => ({
    time: new Date(l.recordedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    temp: l.temperatureC,
    rain: l.rainfallMm,
    humidity: l.humidity,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Weather Monitoring</h1>
        <div className="flex items-center gap-3">
          <select
            value={activeFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {farms.map((f: { id: string; name: string }) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            loading={refreshMutation.isPending}
            onClick={() => activeFarmId && refreshMutation.mutate()}
            disabled={!activeFarmId}
          >
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Current conditions */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Temperature', value: `${latest.temperatureC}°C`, icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-100' },
            { label: 'Humidity', value: `${latest.humidity}%`, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-100' },
            { label: 'Rainfall', value: `${latest.rainfallMm}mm`, icon: CloudSun, color: 'text-teal-500', bg: 'bg-teal-100' },
            { label: 'Wind Speed', value: `${latest.windSpeedKph}kph`, icon: Wind, color: 'text-gray-500', bg: 'bg-gray-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Temperature chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature (Last 72h)</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="°C" />
              <Tooltip />
              <Line type="monotone" dataKey="temp" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Weather Alerts</CardTitle>
          <span className="text-sm text-gray-500">{alerts.filter((a: { isRead: boolean }) => !a.isRead).length} unread</span>
        </CardHeader>
        {alerts.length === 0 ? (
          <p className="text-center text-gray-400 py-6">No weather alerts.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.slice(0, 10).map((a: { id: string; title: string; message: string; severity: string; isRead: boolean; triggeredAt: string }) => (
              <li key={a.id} className={`flex gap-3 p-3 rounded-lg ${a.isRead ? 'bg-gray-50' : 'bg-yellow-50 border border-yellow-200'}`}>
                <Eye size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <Badge variant={a.severity === 'CRITICAL' ? 'red' : a.severity === 'WARNING' ? 'yellow' : 'blue'}>
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(a.triggeredAt), { addSuffix: true })}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
