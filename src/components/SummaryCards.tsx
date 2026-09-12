import { Inbox, TrendingUp, AlertTriangle } from 'lucide-react';
import React from 'react';


interface SummaryCardProps {
  label: string;
  value: number;
  accent?: 'blue' | 'amber' | 'rose' | 'slate';
}

function SummaryCard({ label, value, accent = 'blue' }: SummaryCardProps) {
  const iconMap ={
    blue: Inbox,
    amber: AlertTriangle,
    rose: TrendingUp,
    slate: Inbox,
  }
  const accentMap = {
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${accentMap[accent]}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">{label}</div>
        <div className="text-3xl font-semibold text-slate-900">
          {value}
        </div>
      </div>
      <div className="mt-4">
        {React.createElement(iconMap[accent], { className: `h-6 w-6 ${accentMap[accent].split(' ').slice(-1)}` })}
      </div>
    </div>
  );
}

interface SummaryCardsProps {
  totalAlerts: number;
  unknownErrors: number;
  responseValidationErrors: number;
  totalRequests: number;
}

export function SummaryCards({
  totalAlerts,
  unknownErrors,
  responseValidationErrors,
  totalRequests,
}: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Total Alerts" value={totalAlerts} accent="blue" />
      <SummaryCard label="Unknown Errors" value={unknownErrors} accent="amber" />
      <SummaryCard label="Response Validation Errors" value={responseValidationErrors} accent="rose" />
      <SummaryCard label="Total Requests" value={totalRequests} accent="slate" />
    </div>
  );
}
