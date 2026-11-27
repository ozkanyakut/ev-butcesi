import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, Users } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../constants/categories';

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSubmit,
  person1,
  person2,
  categoryLimits,
  initialData = null
}) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseFor, setExpenseFor] = useState('Ortak');
  const [paidBy, setPaidBy] = useState(person1);
  const [paymentMethod, setPaymentMethod] = useState('Kredi Kartı');
  const [billingDay, setBillingDay] = useState(1);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setAmount(initialData.amount != null ? String(initialData.amount) : '');
        setCategory(initialData.category || (categoryLimits[0]?.name || INITIAL_CATEGORIES.Gider[0].name));
        setExpenseFor(initialData.expenseFor || initialData.person || 'Ortak');
        setPaidBy(initialData.paidBy || (initialData.person === person2 ? person2 : person1));
        setPaymentMethod(initialData.paymentMethod || 'Kredi Kartı');
        setBillingDay(initialData.billingDay || 1);
      } else {
        setTitle('');
        setAmount('');
        setCategory(categoryLimits[0]?.name || INITIAL_CATEGORIES.Gider[0].name);
        setExpenseFor('Ortak');
        setPaidBy(person1);
        setPaymentMethod('Kredi Kartı');
        setBillingDay(new Date().getDate());
      }
    }
  }, [isOpen, initialData, person1, person2, categoryLimits]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      category: category || categoryLimits[0]?.name || INITIAL_CATEGORIES.Gider[0].name,
      person: expenseFor,
      expenseFor,
      paidBy,
      paymentMethod,
      billingDay: parseInt(billingDay, 10) || 1,
      active: true
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {isEditing ? 'Aboneliği Düzenle' : 'Yeni Abonelik Ekle'}
            </h3>
            <p className="text-xs text-slate-400">
              Bu gider her ay otomatik olarak bütçenize yansır.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Abonelik Adı</label>
            <input
              type="text"
              placeholder="Örn: Netflix, Spotify, Ev İnterneti, Spor Salonu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Aylık Tutar (₺)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              required
            />
          </div>

          {/* Harcama Sahibi (Kimin İçin?) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" /> Harcama Türü
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['Ortak', person1, person2].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExpenseFor(p)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    expenseFor === p
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === 'Ortak' ? 'Ev / Ortak' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Ödeme Yöntemi ve Ödeyen Kart / Kişi */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                {paymentMethod === 'Kredi Kartı' ? (
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                )}
                Ödeme Yöntemi
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Kredi Kartı')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'Kredi Kartı'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Kredi Kartı
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nakit')}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod !== 'Kredi Kartı'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Nakit / Havale
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {paymentMethod === 'Kredi Kartı' ? 'Ödemenin Çekildiği Kart' : 'Ödemeyi Yapan Kişi'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaidBy(person1)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    paidBy === person1
                      ? paymentMethod === 'Kredi Kartı'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {paymentMethod === 'Kredi Kartı' ? `${person1}'in Kartı` : `${person1} (Nakit)`}
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy(person2)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    paidBy === person2
                      ? paymentMethod === 'Kredi Kartı'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {paymentMethod === 'Kredi Kartı' ? `${person2}'nin Kartı` : `${person2} (Nakit)`}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categoryLimits.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {paymentMethod === 'Kredi Kartı' ? 'Aylık Çekim Günü' : 'Aylık Ödeme Günü'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(e) => setBillingDay(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  required
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">. gün</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isEditing ? 'Abonelik Bilgilerini Güncelle' : 'Aboneliği Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
