import React from 'react';

export default function StatCard({ label, value, icon: Icon, badgeBg, badgeText, valueColor = 'text-slate-900' }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-between">
        <h3 className={`text-2xl font-bold ${valueColor}`}>{value}</h3>
        <div className={`p-2 rounded-xl ${badgeBg} ${badgeText}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
