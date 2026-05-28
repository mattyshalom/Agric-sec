import React from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-primary-100', trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={cn('mt-1 text-sm font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
