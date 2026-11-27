import React from 'react';

export default function BudgetLimits({ categoryLimits, transactions }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-base">Kategori Bazlı Limitler</h2>
        <span className="text-xs text-slate-400">Dönem içi harcamalar</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryLimits.map((cat) => {
          const spent = transactions
            .filter((t) => t.type === 'Gider' && t.category === cat.name)
            .reduce((a, b) => a + b.amount, 0);
          const limit = cat.limit || 0;
          const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : (spent > 0 ? 100 : 0);
          const isOverLimit = spent > limit && limit > 0;

          return (
            <div
              key={cat.name}
              className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
            >
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-700">{cat.name}</span>
                <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                  ₺{spent.toLocaleString('tr-TR')} / ₺{limit.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverLimit ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>%{limit > 0 ? Math.round((spent / limit) * 100) : 0} kullanıldı</span>
                {isOverLimit && <span className="text-rose-500 font-medium">Limit aşıldı!</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
