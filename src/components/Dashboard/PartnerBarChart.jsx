import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PartnerBarChart({ data }) {
  const hasExpenses = data && data.some((d) => d.Harcama > 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h2 className="text-base font-bold text-slate-800 mb-4">Eşler Arası Harcama Paylaşımı</h2>
      {hasExpenses ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip formatter={(value) => `₺${Number(value).toLocaleString('tr-TR')}`} />
              <Bar dataKey="Harcama" fill="#6366F1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-400 text-sm">Harcama verisi bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
