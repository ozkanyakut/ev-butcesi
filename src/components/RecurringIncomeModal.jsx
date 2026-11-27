import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function RecurringIncomeModal({
  isOpen,
  onClose,
  onSubmit,
  person1,
  person2,
  initialData = null
}) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(1);
  const [person, setPerson] = useState('Ortak');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setAmount(initialData.amount != null ? String(initialData.amount) : '');
        setDay(initialData.day || 1);
        setPerson(initialData.person || 'Ortak');
      } else {
        setTitle('');
        setAmount('');
        setDay(1);
        setPerson('Ortak');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      day: Math.min(31, Math.max(1, parseInt(day, 10) || 1)),
      person,
      active: true
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {isEditing ? 'Düzenli Geliri Güncelle' : 'Yeni Düzenli Gelir Ekle'}
            </h3>
            <p className="text-xs text-slate-400">
              Bu gelir her ay bütçenize otomatik olarak yansıtılır.
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Gelir Kalemi Adı</label>
            <input
              type="text"
              placeholder="Örn: Maaş, Emekli Maaşı, Kira Geliri"
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
              step="100"
              min="1"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hesaba Geçen Kişi</label>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value={person1}>{person1}</option>
                <option value={person2}>{person2}</option>
                <option value="Ortak">Ortak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ayın Günü</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  required
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">. günü</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isEditing ? 'Gelir Tutarını Güncelle' : 'Düzenli Geliri Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
