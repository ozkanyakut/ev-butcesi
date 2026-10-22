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
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  PlusCircle, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, 
  Users, Filter, AlertCircle, CheckCircle2, RefreshCw, Calendar
} from 'lucide-react';

// ==========================================
// FIREBASE KONFİGÜRASYONU
// Firebase Console'dan aldığınız bilgileri buraya yapıştırın:
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
let isFirebaseActive = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "BURAYA_API_KEY_GELECEK") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseActive = true;
  }
} catch (error) {
  console.warn("Firebase başlatılamadı, Demo modunda çalışılıyor:", error);
}

// Varsayılan Kategoriler ve Bütçe Limitleri (TL)
const CATEGORIES = {
  Gider: [
    { name: 'Mutfak & Market', limit: 15000, color: '#EF4444' },
    { name: 'Kira & Aidat', limit: 25000, color: '#F97316' },
    { name: 'Faturalar', limit: 5000, color: '#F59E0B' },
    { name: 'Eğlence & Sosyal', limit: 8000, color: '#EC4899' },
    { name: 'Ulaşım & Yakıt', limit: 6000, color: '#8B5CF6' },
    { name: 'Sağlık & Kişisel Bakım', limit: 4000, color: '#06B6D4' },
    { name: 'Çocuk / Eğitim', limit: 10000, color: '#3B82F6' },
    { name: 'Diğer Giderler', limit: 5000, color: '#64748B' }
  ],
  Gelir: [
    { name: 'Maaş', color: '#10B981' },
    { name: 'Ek Gelir', color: '#059669' },
    { name: 'Yatırım Getirisi', color: '#047857' },
    { name: 'Diğer Gelirler', color: '#065F46' }
  ]
};

const PERSONS = ['Ahmet', 'Ece', 'Ortak'];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [personFilter, setPersonFilter] = useState('Hepsi');

  // Form Durumları
  const [type, setType] = useState('Gider');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.Gider[0].name);
  const [person, setPerson] = useState('Ahmet');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Verileri Firebase veya LocalStorage'dan Çekme
  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(data);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Hata:", error);
        loadLocalData();
      });
      return () => unsubscribe();
    } else {
      loadLocalData();
    }
  }, []);

  const loadLocalData = () => {
    const localData = localStorage.getItem('ev_butcesi_data');
    if (localData) {
      setTransactions(JSON.parse(localData));
    } else {
      // Örnek Demo Veriler
      const demoData = [
        { id: '1', title: 'Aylık Mutfak Alışverişi', amount: 4200, type: 'Gider', category: 'Mutfak & Market', person: 'Ece', date: `${selectedMonth}-05` },
        { id: '2', title: 'Maaş', amount: 65000, type: 'Gelir', category: 'Maaş', person: 'Ahmet', date: `${selectedMonth}-01` },
        { id: '3', title: 'Maaş', amount: 55000, type: 'Gelir', category: 'Maaş', person: 'Ece', date: `${selectedMonth}-01` },
        { id: '4', title: 'Ev Kirası', amount: 22000, type: 'Gider', category: 'Kira & Aidat', person: 'Ortak', date: `${selectedMonth}-02` },
        { id: '5', title: 'Elektrik & Su Faturaları', amount: 1850, type: 'Gider', category: 'Faturalar', person: 'Ahmet', date: `${selectedMonth}-10` },
      ];
      setTransactions(demoData);
      localStorage.setItem('ev_butcesi_data', JSON.stringify(demoData));
    }
    setLoading(false);
  };

  // Yeni İşlem Ekleme
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
      const updated = [ { ...newTransaction, id: Date.now().toString() }, ...transactions ];
      setTransactions(updated);
      localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
    }

    // Formu Sıfırla
    setTitle('');
    setAmount('');
  };

  // İşlem Silme
  const handleDelete = async (id) => {
    if (isFirebaseActive && db) {
      await deleteDoc(doc(db, 'transactions', id));
    } else {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
    }
  };

  // Filtrelenmiş Veriler
  const filteredTransactions = transactions.filter(t => {
    const monthMatch = t.date.startsWith(selectedMonth);
    const personMatch = personFilter === 'Hepsi' || t.person === personFilter;
    return monthMatch && personMatch;
  });

  // Hesaplamalar
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Gelir')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'Gider')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  // Grafik Verileri - Kategori Dağılımı (Giderler)
  const categoryData = CATEGORIES.Gider.map(cat => {
    const catTotal = filteredTransactions
      .filter(t => t.type === 'Gider' && t.category === cat.name)
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: catTotal, color: cat.color, limit: cat.limit };
  }).filter(c => c.value > 0);

  // Grafik Verileri - Kişi Bazlı Harcama
  const personData = PERSONS.map(p => {
    const pExpense = filteredTransactions
      .filter(t => t.type === 'Gider' && t.person === p)
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: p, Harcama: pExpense };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Üst Başlık & Durum Rozeti */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-indigo-600" />
              Ev Bütçesi & Harcama Takibi
            </h1>
            <p className="text-slate-500 text-sm mt-1">Eşinizle ortak bütçenizi anlık olarak yönetin.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isFirebaseActive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isFirebaseActive ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {isFirebaseActive ? 'Canlı Senkronize (Firebase)' : 'Demo Modu (Yerel Kayıt)'}
            </span>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-500 ml-2" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Gelir</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">₺{totalIncome.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Gider</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">₺{totalExpense.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kalan Bütçe</p>
              <h3 className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                ₺{netBalance.toLocaleString('tr-TR')}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasarruf Oranı</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">%{savingsRate}</h3>
            </div>
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Orta Bölüm: Ekleme Formu & Bütçe Limitleri */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Yeni Harcama/Gelir Formu */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" /> Yeni İşlem Ekle
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('Gider'); setCategory(CATEGORIES.Gider[0].name); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${type === 'Gider' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Gider
                </button>
                <button
                  type="button"
                  onClick={() => { setType('Gelir'); setCategory(CATEGORIES.Gelir[0].name); }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${type === 'Gelir' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Gelir
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Açıklama</label>
                <input
                  type="text"
                  placeholder="Örn: Mutfak Alışverişi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tutar (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Harcayan / Alan</label>
                  <select
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES[type].map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-all ${
                  type === 'Gider' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {type === 'Gider' ? 'Gider Ekle' : 'Gelir Ekle'}
              </button>
            </form>
          </div>

          {/* Kategori Bazlı Bütçe Limit Uyarısı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between">
              <span>Aylık Kategori Bütçe Durumu</span>
              <span className="text-xs text-slate-400 font-normal">Belirlenen Limitler</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {CATEGORIES.Gider.map(cat => {
                const spent = filteredTransactions
                  .filter(t => t.type === 'Gider' && t.category === cat.name)
                  .reduce((acc, t) => acc + t.amount, 0);
                const percent = Math.min(Math.round((spent / cat.limit) * 100), 100);
                const isOver = spent > cat.limit;

                return (
                  <div key={cat.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                      <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-500'}`}>
                        ₺{spent.toLocaleString('tr-TR')} / ₺{cat.limit.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grafikler Alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pasta Grafiği - Gider Dağılımı */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Gider Kategorileri Dağılımı</h2>
            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (%${(percent * 100).toFixed(0)})`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₺${value.toLocaleString('tr-TR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Bu ay için henüz gider verisi bulunmuyor.
              </div>
            )}
          </div>

          {/* Çubuk Grafik - Eşler Arası Harcama Kıyaslaması */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Kişi Bazlı Harcama Dağılımı</h2>
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

        {/* Alt Bölüm: İşlem Geçmişi Tablosu */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800">Son İşlemler ({filteredTransactions.length})</h2>
            
            {/* Kişi Filtresi */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {['Hepsi', ...PERSONS].map(p => (
                  <button
                    key={p}
                    onClick={() => setPersonFilter(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      personFilter === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">Tarih</th>
                  <th className="p-3">Açıklama</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Kişi</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-slate-500 text-xs">{t.date}</td>
                    <td className="p-3 font-semibold text-slate-800">{t.title}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        <Users className="w-3 h-3 text-indigo-500" /> {t.person}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold ${t.type === 'Gelir' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'Gelir' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 text-sm">
                      Seçilen filtrelerde kayıtlı işlem bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}