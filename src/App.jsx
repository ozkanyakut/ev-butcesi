import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  PlusCircle, Trash2, Wallet, ArrowUpRight, ArrowDownRight, 
  Settings, LayoutDashboard, ListOrdered, Target, Plus, X, Calendar
} from 'lucide-react';

// ==========================================
// FIREBASE KONFİGÜRASYONU
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBQxsLhnpkjL8IQqelqoFrKe68Cpgqup2A",
  authDomain: "home-budget-c9f7c.firebaseapp.com",
  projectId: "home-budget-c9f7c",
  storageBucket: "home-budget-c9f7c.firebasestorage.app",
  messagingSenderId: "226490342667",
  appId: "1:226490342667:web:e59e43a1f3d3fbdf73560e",
  measurementId: "G-63X5HH4P3G"
};

// Firebase Başlatma
let db = null;
let isFirebaseActive = true;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase çalıştırılamadı:", error);
  isFirebaseActive = false;
}

const INITIAL_CATEGORIES = {
  Gider: [
    { name: 'Mutfak / Market', limit: 15000, color: '#10B981' },
    { name: 'Kira / Ev', limit: 25000, color: '#6366F1' },
    { name: 'Faturalar', limit: 5000, color: '#F59E0B' },
    { name: 'Eğlence / Sosyal', limit: 8000, color: '#EC4899' },
    { name: 'Ulaşım / Yakıt', limit: 6000, color: '#8B5CF6' },
    { name: 'Sağlık / Bakım', limit: 4000, color: '#06B6D4' },
    { name: 'Çocuk / Eğitim', limit: 10000, color: '#3B82F6' },
    { name: 'Diğer Giderler', limit: 5000, color: '#64748B' }
  ],
  Gelir: [
    { name: 'Maaş', color: '#10B981' },
    { name: 'Ek Gelir', color: '#059669' },
    { name: 'Diğer Gelirler', color: '#065F46' }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [personFilter, setPersonFilter] = useState('Hepsi');

  // Ayarlar & Limitler State'leri
  const [person1, setPerson1] = useState(() => localStorage.getItem('p1_name') || 'Özkan');
  const [person2, setPerson2] = useState(() => localStorage.getItem('p2_name') || 'Ece');
  const [categoryLimits, setCategoryLimits] = useState(() => {
    const saved = localStorage.getItem('category_limits');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES.Gider;
  });

  // Modal ve Form State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('Gider');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INITIAL_CATEGORIES.Gider[0].name);
  const [person, setPerson] = useState(person1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Gelir/Gider Değiştiğinde Kategoriyi Otomatik Güncelle
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'Gelir') {
      setCategory(INITIAL_CATEGORIES.Gelir[0].name);
    } else {
      setCategory(categoryLimits[0].name);
    }
  };

  // Ayarları Kaydet
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('p1_name', person1);
    localStorage.setItem('p2_name', person2);
    localStorage.setItem('category_limits', JSON.stringify(categoryLimits));
    alert('Ayarlar ve Bütçe Limitleri Kaydedildi!');
  };

  // Limit Güncelleme
  const handleLimitChange = (index, newLimit) => {
    const updated = [...categoryLimits];
    updated[index].limit = parseFloat(newLimit) || 0;
    setCategoryLimits(updated);
  };

  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(data);
      });
      return () => unsubscribe();
    } else {
      const localData = localStorage.getItem('ev_butcesi_data');
      if (localData) {
        setTransactions(JSON.parse(localData));
      } else {
        const demoData = [
          { id: '1', title: `${person1} Maaş`, amount: 45000, type: 'Gelir', category: 'Maaş', person: person1, date: `${selectedMonth}-01` },
          { id: '2', title: `${person2} Maaş`, amount: 42000, type: 'Gelir', category: 'Maaş', person: person2, date: `${selectedMonth}-01` },
          { id: '3', title: 'Mutfak Alışverişi', amount: 4800, type: 'Gider', category: 'Mutfak / Market', person: person2, date: `${selectedMonth}-05` },
          { id: '4', title: 'Ev Kirası', amount: 18000, type: 'Gider', category: 'Kira / Ev', person: 'Ortak', date: `${selectedMonth}-02` },
        ];
        setTransactions(demoData);
        localStorage.setItem('ev_butcesi_data', JSON.stringify(demoData));
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || parseFloat(amount) <= 0) return;

    const newTransaction = {
      title,
      amount: parseFloat(amount),
      type,
      category,
      person,
      date,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseActive && db) {
      await addDoc(collection(db, 'transactions'), newTransaction);
    } else {
      const updated = [{ ...newTransaction, id: Date.now().toString() }, ...transactions];
      setTransactions(updated);
      localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
    }

    setTitle('');
    setAmount('');
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (isFirebaseActive && db) {
      await deleteDoc(doc(db, 'transactions', id));
    } else {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const monthMatch = t.date.startsWith(selectedMonth);
    const personMatch = personFilter === 'Hepsi' || t.person === personFilter;
    return monthMatch && personMatch;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'Gelir').reduce((a, b) => a + b.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Gider').reduce((a, b) => a + b.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  const categoryData = categoryLimits.map(cat => {
    const val = filteredTransactions.filter(t => t.type === 'Gider' && t.category === cat.name).reduce((a, b) => a + b.amount, 0);
    return { name: cat.name, value: val, color: cat.color };
  }).filter(c => c.value > 0);

  const personData = [
    { name: person1, Harcama: filteredTransactions.filter(t => t.type === 'Gider' && t.person === person1).reduce((a, b) => a + b.amount, 0) },
    { name: person2, Harcama: filteredTransactions.filter(t => t.type === 'Gider' && t.person === person2).reduce((a, b) => a + b.amount, 0) },
    { name: 'Ortak', Harcama: filteredTransactions.filter(t => t.type === 'Gider' && t.person === 'Ortak').reduce((a, b) => a + b.amount, 0) }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">Ev Bütçe Yönetimi</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                    {person1} & {person2}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isFirebaseActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {isFirebaseActive ? 'Canlı Senkronize' : 'Demo Modu'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setIsModalOpen(true); handleTypeChange('Gider'); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Yeni Ekle
            </button>
          </div>

          <div className="flex space-x-8 border-t border-slate-100 pt-2 text-sm font-medium">
            <button onClick={() => setActiveTab('dashboard')} className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'dashboard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <LayoutDashboard className="w-4 h-4" /> Özet Pano
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <ListOrdered className="w-4 h-4" /> Gelir & Giderler
            </button>
            <button onClick={() => setActiveTab('limits')} className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'limits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Target className="w-4 h-4" /> Bütçe Limitleri
            </button>
            <button onClick={() => setActiveTab('settings')} className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Settings className="w-4 h-4" /> Ayarlar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Dönem Seçimi:</span>
          </div>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* ÖZET PANO */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TOPLAM GELİR</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">₺{totalIncome.toLocaleString('tr-TR')}</h3>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TOPLAM GİDER</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">₺{totalExpense.toLocaleString('tr-TR')}</h3>
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><ArrowDownRight className="w-5 h-5" /></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">KALAN BÜTÇE</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-indigo-600">₺{netBalance.toLocaleString('tr-TR')}</h3>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Wallet className="w-5 h-5" /></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">TASARRUF ORANI</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">%{savingsRate}</h3>
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Target className="w-5 h-5" /></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-4">Kategori Bazlı Gider Dağılımı</h2>
                {categoryData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}>
                          {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-center py-12 text-slate-400 text-sm">Gider verisi bulunmuyor.</p>}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-4">Eşler Arası Harcama Paylaşımı</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={personData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
                      <Bar dataKey="Harcama" fill="#6366F1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* GELİR & GİDERLER TABLOSU */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Tüm İşlemler ({filteredTransactions.length})</h2>
              <div className="flex gap-2">
                {['Hepsi', person1, person2, 'Ortak'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPersonFilter(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${personFilter === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">Tarih</th>
                  <th className="p-3">Açıklama</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Kişi</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-center">Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-xs text-slate-500">{t.date}</td>
                    <td className="p-3 font-semibold text-slate-800">{t.title}</td>
                    <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">{t.category}</span></td>
                    <td className="p-3 text-xs font-semibold text-slate-600">{t.person}</td>
                    <td className={`p-3 text-right font-bold ${t.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'Gelir' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BÜTÇE LİMİTLERİ */}
        {activeTab === 'limits' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800">Kategori Bazlı Limitler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryLimits.map(cat => {
                const spent = filteredTransactions.filter(t => t.type === 'Gider' && t.category === cat.name).reduce((a, b) => a + b.amount, 0);
                const percent = Math.min(Math.round((spent / (cat.limit || 1)) * 100), 100);
                return (
                  <div key={cat.name} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{cat.name}</span>
                      <span className={spent > cat.limit ? 'text-rose-600' : 'text-slate-600'}>
                        ₺{spent.toLocaleString('tr-TR')} / ₺{(cat.limit || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${spent > cat.limit ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AYARLAR & BÜTÇE LİMİT DÜZENLEME */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="w-5 h-5 text-indigo-600" /> Profil ve Bütçe Limit Ayarları
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Kişi İsimleri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">1. Kişinin İsmi</label>
                  <input
                    type="text"
                    value={person1}
                    onChange={(e) => setPerson1(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">2. Kişinin İsmi</label>
                  <input
                    type="text"
                    value={person2}
                    onChange={(e) => setPerson2(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Bütçe Limitleri Düzenleme */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">Kategori Aylık Limitlerini Belirleyin (₺)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryLimits.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-medium text-slate-700 truncate">{cat.name}</span>
                      <input
                        type="number"
                        value={cat.limit}
                        onChange={(e) => handleLimitChange(idx, e.target.value)}
                        className="w-28 p-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-right outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
              >
                Tüm Ayarları ve Limitleri Kaydet
              </button>
            </form>
          </div>
        )}

      </div>

      {/* YENİ İŞLEM EKLEME MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800">Yeni İşlem Ekle</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => handleTypeChange('Gider')} 
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${type === 'Gider' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Gider
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTypeChange('Gelir')} 
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${type === 'Gelir' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Gelir
                </button>
              </div>

              <input type="text" placeholder="Açıklama" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
              <input type="number" step="0.01" placeholder="Tutar (₺)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />

              <div className="grid grid-cols-2 gap-2">
                <select value={person} onChange={(e) => setPerson(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value={person1}>{person1}</option>
                  <option value={person2}>{person2}</option>
                  <option value="Ortak">Ortak</option>
                </select>

                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                  {(type === 'Gelir' ? INITIAL_CATEGORIES.Gelir : categoryLimits).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />

              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all">
                {type === 'Gelir' ? 'Gelir Ekle' : 'Gider Ekle'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}