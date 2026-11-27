import React from 'react';
import { Calendar } from 'lucide-react';

export default function PeriodSelector({ selectedMonth, onMonthChange }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
        <Calendar className="w-4 h-4 text-indigo-600" />
        <span>Dönem Seçimi:</span>
      </div>
      <input 
        type="month" 
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
