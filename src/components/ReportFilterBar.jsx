import React from 'react';
import { Filter, Search, X, RotateCcw } from 'lucide-react';

export default function ReportFilterBar({
  filters,
  onChange,
  onReset,
  person1,
  person2,
  categories,
  totalCount,
  filteredCount,
  showTypeFilter = true
}) {
  const activeFilterCount = [
    filters.expenseFor !== 'Hepsi',
    filters.paidBy !== 'Hepsi',
    filters.paymentMethod !== 'Hepsi',
    showTypeFilter && filters.type !== 'Hepsi',
    filters.category !== 'Hepsi',
    filters.search.trim() !== ''
  ].filter(Boolean).length;

  const update = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800">Rapor Filtreleri</span>
          {activeFilterCount > 0 ? (
            <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {activeFilterCount} aktif · {filteredCount}/{totalCount} kayıt
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              ({totalCount} kayıt gösteriliyor)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          {/* Arama Kutusu */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update('search', e.target.value)}
              placeholder="Açıklama veya kategori ara..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-700"
            />
            {filters.search && (
              <button
                onClick={() => update('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors whitespace-nowrap"
              title="Tüm filtreleri sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* Filtre Seçicileri */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. Harcama Türü (Kimin İçin) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Harcama Türü
          </label>
          <select
            value={filters.expenseFor}
            onChange={(e) => update('expenseFor', e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              filters.expenseFor !== 'Hepsi'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="Hepsi">Tümü</option>
            <option value="Ortak">Ev / Ortak</option>
            <option value={person1}>{person1}</option>
            <option value={person2}>{person2}</option>
          </select>
        </div>

        {/* 2. Ödeyen Kart / Kişi */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Ödeyen Kart / Kişi
          </label>
          <select
            value={filters.paidBy}
            onChange={(e) => update('paidBy', e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              filters.paidBy !== 'Hepsi'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="Hepsi">Tümü</option>
            <option value={person1}>{person1}</option>
            <option value={person2}>{person2}</option>
            <option value="Ortak">Ortak</option>
          </select>
        </div>

        {/* 3. Ödeme Yöntemi */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Ödeme Yöntemi
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => update('paymentMethod', e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              filters.paymentMethod !== 'Hepsi'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="Hepsi">Tümü</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Nakit">Nakit</option>
          </select>
        </div>

        {/* 4. Kategori */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            Kategori
          </label>
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              filters.category !== 'Hepsi'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="Hepsi">Tüm Kategoriler</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 5. İşlem Tipi (Gelir / Gider) */}
        {showTypeFilter && (
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              İşlem Tipi
            </label>
            <select
              value={filters.type}
              onChange={(e) => update('type', e.target.value)}
              className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                filters.type !== 'Hepsi'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="Hepsi">Gelir & Gider</option>
              <option value="Gelir">Sadece Gelir</option>
              <option value="Gider">Sadece Gider</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
