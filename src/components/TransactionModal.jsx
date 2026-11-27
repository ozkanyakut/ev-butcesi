import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, Users, User } from 'lucide-react';
import { INITIAL_CATEGORIES } from '../constants/categories';
import { getCardConfigForOwner, calculateFirstDueDate } from '../utils/cardBilling';

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  person1,
  person2,
  categoryLimits,
  cardSettings,
  initialData = null
}) {
  const isEditing = Boolean(initialData);

  const [type, setType] = useState('Gider');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Yeni Ayrı Alanlar:
  // 1. Harcama Türü / Kime Ait: 'Ortak' | person1 | person2
  const [expenseFor, setExpenseFor] = useState('Ortak');
  // 2. Ödemeyi Yapan / Hangi Kart: person1 | person2
  const [paidBy, setPaidBy] = useState(person1);

  // Ödeme Yöntemi ve Taksit
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'Gider');
        setTitle(initialData.title || '');
        setAmount(initialData.amount != null ? String(initialData.amount) : '');
        setCategory(initialData.category || (categoryLimits[0]?.name || ''));
        setDate(initialData.date || new Date().toISOString().split('T')[0]);
        setExpenseFor(initialData.expenseFor || initialData.person || 'Ortak');
        setPaidBy(initialData.paidBy || (initialData.person === person2 ? person2 : person1));
        setPaymentMethod(initialData.paymentMethod || 'Nakit');
        setIsInstallment(Boolean(initialData.isInstallment));
        setInstallmentCount(initialData.installmentTotal || 3);
      } else {
        setType('Gider');
        setTitle('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setExpenseFor('Ortak');
        setPaidBy(person1);
        setPaymentMethod('Kredi Kartı');
        setIsInstallment(false);
        setInstallmentCount(3);
        if (categoryLimits && categoryLimits.length > 0) {
          setCategory(categoryLimits[0].name);
        }
      }
    }
  }, [isOpen, initialData, person1, person2, categoryLimits]);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'Gelir') {
      setCategory(INITIAL_CATEGORIES.Gelir[0].name);
      setPaymentMethod('Nakit');
      setIsInstallment(false);
    } else {
      setCategory(categoryLimits[0]?.name || INITIAL_CATEGORIES.Gider[0].name);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method !== 'Kredi Kartı') {
      setIsInstallment(false);
    }
  };

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const installmentAmount = (isInstallment && installmentCount > 0 && parsedAmount > 0)
    ? (parsedAmount / installmentCount)
    : 0;

  const { cutoffDay: activeCutoffDay, dueDay: activeDueDay } = getCardConfigForOwner(
    paidBy,
    person1,
    person2,
    cardSettings
  );
  const firstDueDateStr = paymentMethod === 'Kredi Kartı'
    ? calculateFirstDueDate(date, activeCutoffDay, activeDueDay)
    : date;
  const formattedFirstDueDate = firstDueDateStr
    ? new Date(`${firstDueDateStr}T12:00:00`).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: category || (type === 'Gelir' ? INITIAL_CATEGORIES.Gelir[0].name : categoryLimits[0]?.name),
      // Geriye dönük uyumluluk ve denge takibi için:
      person: expenseFor, // Harcama sahibi (Dashboard filtreleri için)
      expenseFor,         // Kime Ait (Kişisel / Ortak)
      paidBy,             // Ödeyen Kart / Kişi (Ekstre ve denge için)
      date,
      paymentMethod: type === 'Gelir' ? 'Nakit' : paymentMethod,
      isInstallment: type === 'Gider' && paymentMethod === 'Kredi Kartı' && isInstallment,
      installmentCount: isInstallment ? parseInt(installmentCount, 10) : 1
    });
  };

  const categoryList = type === 'Gelir' ? INITIAL_CATEGORIES.Gelir : categoryLimits;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base">
            {isEditing ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Tip Seçimi: Gelir / Gider */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('Gider')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                type === 'Gider'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Gider
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('Gelir')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                type === 'Gelir'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Gelir
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Açıklama</label>
            <input
              type="text"
              placeholder="Örn: Market, Beyaz Eşya, Kişisel Bakım"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {isInstallment ? 'Toplam Tutar (₺)' : 'Tutar (₺)'}
            </label>
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

          {/* GİDER İSE: HARCAMA SAHİBİ VE ÖDEYEN KART AYRIMI */}
          {type === 'Gider' ? (
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {/* 1. Harcama Türü (Kimin Harcaması?) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Harcama Türü (Kimin İçin Yapıldı?)
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
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

              {/* 2. Ödeme Yöntemi ve Ödeyen Kart */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Ödemeyi Yapan Kart / Kişi
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPaidBy(person1)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                      paidBy === person1
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">1. Kart / Hesap</div>
                    <div className="font-bold">{person1}'in Kartı</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidBy(person2)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                      paidBy === person2
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">2. Kart / Hesap</div>
                    <div className="font-bold">{person2}'nin Kartı</div>
                  </button>
                </div>

                {/* Nakit mi Kredi Kartı mı? */}
                <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange('Kredi Kartı')}
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
                    onClick={() => handlePaymentMethodChange('Nakit')}
                    className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'Nakit'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Nakit / Havale
                  </button>
                </div>

                {/* Kredi Kartı ise Taksit Seçeneği */}
                {paymentMethod === 'Kredi Kartı' && (
                  <div className="pt-2 mt-2 space-y-2 border-t border-slate-200/70">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInstallment}
                        onChange={(e) => setIsInstallment(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">Taksitli mi?</span>
                    </label>

                    {!isInstallment && parsedAmount > 0 && !isEditing && (
                      <div className="p-2 bg-amber-50/70 rounded-lg border border-amber-100 text-[11px] text-amber-800">
                        {paidBy}'in kart hesap kesim gününe ({activeCutoffDay}. gün) göre bu tek çekim harcama <strong>{formattedFirstDueDate}</strong> son ödeme tarihli ekstresine yansıtılacaktır.
                      </div>
                    )}

                    {isInstallment && (
                      <div className="space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-xs text-slate-500 font-medium">Taksit Sayısı:</label>
                          <select
                            value={installmentCount}
                            onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10))}
                            className="p-1.5 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {[2, 3, 4, 5, 6, 8, 9, 10, 12].map((num) => (
                              <option key={num} value={num}>
                                {num} Taksit
                              </option>
                            ))}
                          </select>
                        </div>

                        {parsedAmount > 0 && (
                          <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-900 space-y-1">
                            <div className="flex justify-between font-bold">
                              <span>Aylık Taksit:</span>
                              <span>₺{installmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <p className="text-[11px] text-indigo-700">
                              {paidBy}'in kart hesap kesim gününe ({activeCutoffDay}. gün) göre ilk taksit <strong>{formattedFirstDueDate}</strong> son ödeme tarihinden başlayarak {installmentCount} ay boyunca yansıtılacaktır.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // GELİR İSE
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hesaba Geçen Kişi</label>
              <select
                value={expenseFor}
                onChange={(e) => { setExpenseFor(e.target.value); setPaidBy(e.target.value); }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value={person1}>{person1}</option>
                <option value={person2}>{person2}</option>
                <option value="Ortak">Ortak</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categoryList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {type === 'Gider' && paymentMethod === 'Kredi Kartı' && !isEditing ? 'Harcama / İşlem Tarihi' : 'Tarih'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4" /> Değişiklikleri Kaydet
              </>
            ) : type === 'Gelir' ? (
              'Gelir Ekle'
            ) : isInstallment ? (
              `Taksitli Gideri Kaydet (${installmentCount} Taksit)`
            ) : (
              'Gider Ekle'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
