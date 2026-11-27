import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Plus, Trash2, CreditCard, Calendar } from 'lucide-react';

const PRESET_COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EC4899', 
  '#8B5CF6', '#06B6D4', '#3B82F6', '#EF4444', 
  '#14B8A6', '#F97316', '#64748B'
];

export default function SettingsTab({
  person1: initialPerson1,
  person2: initialPerson2,
  categoryLimits: initialLimits,
  cardSettings: initialCardSettings,
  onSave,
  isSaving = false
}) {
  const [person1, setPerson1] = useState(initialPerson1);
  const [person2, setPerson2] = useState(initialPerson2);
  const [limits, setLimits] = useState(initialLimits);

  // Kredi Kartı Tarihleri
  const [p1Cutoff, setP1Cutoff] = useState(initialCardSettings?.person1?.cutoffDay || 24);
  const [p1Due, setP1Due] = useState(initialCardSettings?.person1?.dueDay || 4);
  const [p2Cutoff, setP2Cutoff] = useState(initialCardSettings?.person2?.cutoffDay || 10);
  const [p2Due, setP2Due] = useState(initialCardSettings?.person2?.dueDay || 20);

  // Yeni kategori ekleme formu state'leri
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    setPerson1(initialPerson1);
  }, [initialPerson1]);

  useEffect(() => {
    setPerson2(initialPerson2);
  }, [initialPerson2]);

  useEffect(() => {
    setLimits(initialLimits);
  }, [initialLimits]);

  useEffect(() => {
    if (initialCardSettings) {
      setP1Cutoff(initialCardSettings.person1?.cutoffDay || 24);
      setP1Due(initialCardSettings.person1?.dueDay || 4);
      setP2Cutoff(initialCardSettings.person2?.cutoffDay || 10);
      setP2Due(initialCardSettings.person2?.dueDay || 20);
    }
  }, [initialCardSettings]);

  // Limit güncelleme
  const handleLimitChange = (index, newLimit) => {
    const updated = [...limits];
    updated[index].limit = parseFloat(newLimit) || 0;
    setLimits(updated);
  };

  // Renk güncelleme
  const handleColorChange = (index, newColor) => {
    const updated = [...limits];
    updated[index].color = newColor;
    setLimits(updated);
  };

  // Kategori silme
  const handleDeleteCategory = (index) => {
    if (limits.length <= 1) {
      alert('En az bir gider kategorisi bulunmalıdır.');
      return;
    }
    const updated = limits.filter((_, i) => i !== index);
    setLimits(updated);
  };

  // Yeni kategori ekleme
  const handleAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (limits.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Bu isimde bir kategori zaten mevcut.');
      return;
    }

    const limitVal = parseFloat(newCatLimit) || 0;
    const newCategory = {
      name: trimmed,
      limit: limitVal,
      color: newCatColor
    };

    setLimits([...limits, newCategory]);
    setNewCatName('');
    setNewCatLimit('');
    const nextColorIndex = (limits.length + 1) % PRESET_COLORS.length;
    setNewCatColor(PRESET_COLORS[nextColorIndex]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      person1,
      person2,
      limits,
      cardSettings: {
        person1: { cutoffDay: parseInt(p1Cutoff, 10) || 24, dueDay: parseInt(p1Due, 10) || 4, cardName: `${person1} Kredi Kartı` },
        person2: { cutoffDay: parseInt(p2Cutoff, 10) || 10, dueDay: parseInt(p2Due, 10) || 20, cardName: `${person2} Kredi Kartı` }
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" /> Profil, Kart ve Bütçe Ayarları
        </h2>
        <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
          Bulut Eşitlemeli
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kişi İsimleri */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">Eşler / Hane Bireyleri</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">1. Kişinin İsmi</label>
              <input
                type="text"
                value={person1}
                onChange={(e) => setPerson1(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">2. Kişinin İsmi</label>
              <input
                type="text"
                value={person2}
                onChange={(e) => setPerson2(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Kredi Kartı Ekstre & Son Ödeme Günleri */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Kredi Kartı Ekstre & Ödeme Döngüsü</h3>
          </div>
          <p className="text-xs text-slate-500">
            Hesap kesim ve son ödeme günlerini belirleyin. Sistem nakit akışını ve vade avantajını bu tarihlere göre yönetir.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* 1. Kişinin Kartı */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-indigo-600">{person1}'in Kartı</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Hesap Kesim:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={p1Cutoff}
                      onChange={(e) => setP1Cutoff(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">. gün</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Son Ödeme:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={p1Due}
                      onChange={(e) => setP1Due(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">. gün</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Kişinin Kartı */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-indigo-600">{person2}'nin Kartı</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Hesap Kesim:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={p2Cutoff}
                      onChange={(e) => setP2Cutoff(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">. gün</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Son Ödeme:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={p2Due}
                      onChange={(e) => setP2Due(e.target.value)}
                      className="w-full p-1.5 border border-slate-200 rounded-lg font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] text-slate-400">. gün</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kategori Yönetimi & Bütçe Limitleri */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">
              Gider Kategorileri & Aylık Limitler ({limits.length})
            </h3>
            <span className="text-[11px] text-slate-400">Limitleri ve renkleri özelleştirin</span>
          </div>

          <div className="space-y-2">
            {limits.map((cat, idx) => (
              <div
                key={cat.name}
                className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative group shrink-0">
                    <input
                      type="color"
                      value={cat.color || '#6366F1'}
                      onChange={(e) => handleColorChange(idx, e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-none bg-transparent appearance-none p-0 overflow-hidden"
                      title="Kategori rengini değiştir"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={cat.limit}
                      onChange={(e) => handleLimitChange(idx, e.target.value)}
                      className="w-24 sm:w-28 p-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-right outline-none focus:ring-2 focus:ring-indigo-500 pr-5"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400 pointer-events-none">₺</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(idx)}
                    disabled={limits.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg transition-colors"
                    title="Kategoriyi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yeni Kategori Ekleme Alt Formu */}
        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Plus className="w-4 h-4 text-indigo-600" /> Yeni Kategori Ekle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Kategori Adı (örn: Tatil, Evcil Hayvan)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="number"
                placeholder="Aylık Limit (₺)"
                value={newCatLimit}
                onChange={(e) => setNewCatLimit(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-8 h-8 rounded-xl cursor-pointer border border-slate-200 bg-white p-0.5"
                title="Renk Seç"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Tüm Ayarları Kaydet Butonu */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Ayarlar Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Tüm Değişiklikleri Buluta Kaydet
            </>
          )}
        </button>
      </form>
    </div>
  );
}
