import React from 'react';
import { Trash2, Pencil, Download, Inbox, CreditCard, Banknote, Repeat, Users, User, CalendarClock } from 'lucide-react';
import { exportToCsv } from '../utils/exportCsv';

export default function TransactionsTable({
  transactions,
  person1,
  person2,
  selectedMonth,
  onEdit,
  onDelete,
  onEditIncome,
  onDeleteIncome,
  onNavigateToSubscriptions
}) {
  const handleExport = () => {
    const filename = `ev-butcesi-${selectedMonth || 'rapor'}`;
    exportToCsv(transactions, filename);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-base">
            Tüm İşlemler ({transactions.length})
          </h2>
          <p className="text-xs text-slate-400">Seçilen dönem ve filtrelere uygun hareketler</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dışa Aktar Butonu */}
          <button
            onClick={handleExport}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold rounded-xl transition-all"
            title="Excel uyumlu CSV olarak indir"
          >
            <Download className="w-3.5 h-3.5" /> Dışa Aktar (CSV)
          </button>
        </div>
      </div>

      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase border-b border-slate-100">
              <tr>
                <th className="p-3">Tarih</th>
                <th className="p-3">Açıklama</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Harcama Türü</th>
                <th className="p-3">Ödeyen Kart / Kişi</th>
                <th className="p-3 text-right">Tutar</th>
                <th className="p-3 text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => {
                const isSub = Boolean(t.isSubscription);
                const isRecurringInc = Boolean(t.isRecurringIncome);
                const isInstallment = Boolean(t.isInstallment);
                const isCard = t.paymentMethod === 'Kredi Kartı';
                const expenseFor = t.expenseFor || t.person || 'Ortak';
                const paidBy = t.paidBy || (t.person === person2 ? person2 : person1);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{t.date}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{t.title}</span>
                        {isSub && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">
                            <Repeat className="w-2.5 h-2.5" /> Abonelik
                          </span>
                        )}
                        {isRecurringInc && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CalendarClock className="w-2.5 h-2.5" /> Düzenli Gelir
                          </span>
                        )}
                        {isInstallment && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                            Taksit {t.installmentIndex}/{t.installmentTotal}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600">
                        {t.category}
                      </span>
                    </td>
                    {/* Harcama Türü (Ortak / Kişisel) */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                          expenseFor === 'Ortak'
                            ? 'bg-blue-50 text-blue-700'
                            : expenseFor === person1
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {expenseFor === 'Ortak' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {expenseFor === 'Ortak' ? 'Ev / Ortak' : expenseFor}
                      </span>
                    </td>
                    {/* Ödeyen Kart / Kişi */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                          isCard
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/50'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/50'
                        }`}
                      >
                        {isCard ? <CreditCard className="w-3 h-3 text-amber-600" /> : <Banknote className="w-3 h-3 text-emerald-600" />}
                        {isCard ? `${paidBy}'in Kartı` : `${paidBy} (Nakit)`}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-bold whitespace-nowrap ${
                        t.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {t.type === 'Gelir' ? '+' : '-'}₺{Number(t.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {isSub ? (
                        <button
                          onClick={onNavigateToSubscriptions}
                          className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors"
                          title="Abonelikler sekmesinden düzenleyin veya silin"
                        >
                          Abonelikten Yönet
                        </button>
                      ) : isRecurringInc ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditIncome && onEditIncome(t.rawIncome)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Düzenli Geliri Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteIncome && onDeleteIncome(t.incomeId)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Düzenli Geliri Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="İşlemi Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="İşlemi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Inbox className="w-10 h-10 mb-2 stroke-1" />
          <p className="text-sm">Seçilen dönem ve filtreye uygun işlem bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
