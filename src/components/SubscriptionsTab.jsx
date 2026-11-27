import React from 'react';
import { Plus, Pencil, Trash2, Repeat, CreditCard, Banknote, Calendar, ShieldCheck } from 'lucide-react';

export default function SubscriptionsTab({
  subscriptions,
  person1,
  person2,
  onOpenAddModal,
  onEdit,
  onDelete
}) {
  const totalMonthly = subscriptions.reduce((acc, s) => acc + (s.amount || 0), 0);
  const p1Total = subscriptions.filter(s => s.person === person1).reduce((acc, s) => acc + (s.amount || 0), 0);
  const p2Total = subscriptions.filter(s => s.person === person2).reduce((acc, s) => acc + (s.amount || 0), 0);
  const sharedTotal = subscriptions.filter(s => s.person === 'Ortak').reduce((acc, s) => acc + (s.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AYLIK TOPLAM ABONELİK</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-indigo-600">₺{totalMonthly.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400">Her ay otomatik yansır</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AKTİF ABONELİK</span>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-800">{subscriptions.length} Adet</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] text-slate-400">Sabit gider kalemleri</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{person1.toUpperCase()}</span>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">₺{p1Total.toLocaleString('tr-TR')}</h3>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Kişisel</span>
          </div>
          <span className="text-[11px] text-slate-400">Aylık bireysel pay</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{person2.toUpperCase()} / ORTAK</span>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">₺{(p2Total + sharedTotal).toLocaleString('tr-TR')}</h3>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Ortak/Kişisel</span>
          </div>
          <span className="text-[11px] text-slate-400">Ortak: ₺{sharedTotal.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      {/* Abonelikler Listesi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Repeat className="w-5 h-5 text-indigo-600" /> Kayıtlı Abonelikler ({subscriptions.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Buradaki abonelikler siz silmediğiniz sürece her ayın giderlerine otomatik olarak dahil edilir.
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Abonelik Ekle
          </button>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => {
              const isCard = (sub.paymentMethod || 'Kredi Kartı') === 'Kredi Kartı';
              const paidBy = sub.paidBy || (sub.person === person2 ? person2 : person1);
              return (
                <div
                  key={sub.id}
                  className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{sub.title}</h4>
                      <span className="inline-block text-[11px] font-medium bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md">
                        {sub.category}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-rose-600">
                        -₺{Number(sub.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-400">/ ay</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {sub.expenseFor || sub.person || 'Ortak'}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isCard ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {isCard ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                        {isCard ? `${paidBy}'in Kartı` : `${paidBy} (Nakit / Havale)`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Her ayın {sub.billingDay || 1}. günü
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                      title="Aboneliği Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Düzenle
                    </button>
                    <button
                      onClick={() => onDelete(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
                      title="Aboneliği Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Repeat className="w-12 h-12 stroke-1 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Henüz kayıtlı aboneliğiniz bulunmuyor.</p>
            <p className="text-xs text-slate-400 max-w-sm text-center">
              Netflix, Spotify, ev interneti, aidat gibi her ay tekrarlayan ödemelerinizi buraya ekleyin, her ay otomatik gider yazılsın.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> İlk Aboneliği Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
