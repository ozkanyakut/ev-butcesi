import React, { useState, useMemo, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Pencil, 
  Trash2, 
  Banknote,
  CheckCircle2,
  CalendarRange,
  Layers,
  Scale,
  Zap,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

export default function PaymentPlanTab({
  transactions,
  subscriptions,
  recurringIncomes,
  person1,
  person2,
  cardSettings,
  onOpenAddIncomeModal,
  onEditIncome,
  onDeleteIncome,
  onConvertSimulationToTransaction
}) {
  const [viewMonthsCount, setViewMonthsCount] = useState(6);

  // Büyük Harcama Simülasyonu State'leri
  const [simulations, setSimulations] = useState(() => {
    const saved = localStorage.getItem('ev_butcesi_simulations');
    return saved ? JSON.parse(saved) : [
      {
        id: 'sim-1',
        title: 'Örnek: Yeni Beyaz Eşya / TV',
        totalAmount: 36000,
        installmentCount: 6,
        paidBy: person1,
        expenseFor: 'Ortak',
        startMonth: new Date().toISOString().slice(0, 7),
        active: false
      }
    ];
  });

  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simTitle, setSimTitle] = useState('');
  const [simAmount, setSimAmount] = useState('');
  const [simInstallment, setSimInstallment] = useState(6);
  const [simPaidBy, setSimPaidBy] = useState(person1);
  const [simExpenseFor, setSimExpenseFor] = useState('Ortak');
  const [simStartMonth, setSimStartMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Simülasyonları kaydet
  useEffect(() => {
    localStorage.setItem('ev_butcesi_simulations', JSON.stringify(simulations));
  }, [simulations]);

  // Güncel tarih bilgisi
  const today = useMemo(() => new Date(), []);
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();

  // Önümüzdeki N ayı üret
  const upcomingMonths = useMemo(() => {
    const list = [];
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    for (let i = 0; i < viewMonthsCount; i++) {
      const targetMonthIdx = currentMonthIdx + i;
      const targetYear = currentYear + Math.floor(targetMonthIdx / 12);
      const modMonth = (targetMonthIdx % 12);
      const key = `${targetYear}-${String(modMonth + 1).padStart(2, '0')}`;
      const label = `${monthNames[modMonth]} ${targetYear}`;
      list.push({ key, label, year: targetYear, month: modMonth + 1 });
    }
    return list;
  }, [currentYear, currentMonthIdx, viewMonthsCount]);

  // Toplam düzenli gelir
  const totalMonthlyIncome = useMemo(() => {
    return recurringIncomes
      .filter((inc) => inc.active !== false)
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);
  }, [recurringIncomes]);

  // 1. Faz Geliri (25'i Avans + 27'si Ek Gelir + 1'i Ek Gelir)
  const phase1Income = useMemo(() => {
    return recurringIncomes
      .filter((inc) => inc.active !== false && (inc.day === 25 || inc.day === 27 || inc.day === 1))
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);
  }, [recurringIncomes]);

  // 2. Faz Geliri (10'u Maaş Kalanı)
  const phase2Income = useMemo(() => {
    return recurringIncomes
      .filter((inc) => inc.active !== false && inc.day === 10)
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);
  }, [recurringIncomes]);

  // Akıllı Kart Öneri Mantığı
  const cardRecommendation = useMemo(() => {
    const p1Cutoff = cardSettings?.person1?.cutoffDay || 24;
    const p2Cutoff = cardSettings?.person2?.cutoffDay || 10;

    if (currentDay >= p2Cutoff && currentDay < p1Cutoff) {
      return {
        bestCard: `${person2}'nin Kartı`,
        reason: `${person2}'nin hesap kesimi (${p2Cutoff}'u) yeni gerçekleşti. Yapacağınız harcama bir sonraki ayın 20'sinde ödenir (~30-40 gün vade kazancı).`,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
      };
    } else {
      return {
        bestCard: `${person1}'in Kartı`,
        reason: `${person1}'in hesap kesimi (${p1Cutoff}'ü) tamamlandı. Yapacağınız harcama sonraki ayın 4'ünde ödenir (~30-40 gün vade kazancı).`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-100'
      };
    }
  }, [currentDay, cardSettings, person1, person2]);

  // Eşler Arası Mahsuplaşma & Harcama Dengesi (Cari Ay İçin)
  const currentMonthKey = upcomingMonths[0]?.key;
  const balanceSummary = useMemo(() => {
    let p1PaidForShared = 0;
    let p2PaidForShared = 0;
    let p1PaidForP2 = 0;
    let p2PaidForP1 = 0;

    // İşlemleri tara
    transactions.forEach((t) => {
      if (t.type === 'Gider' && t.date?.startsWith(currentMonthKey)) {
        const paidBy = t.paidBy || (t.person === person2 ? person2 : person1);
        const expenseFor = t.expenseFor || t.person || 'Ortak';

        if (expenseFor === 'Ortak') {
          if (paidBy === person1) p1PaidForShared += (t.amount || 0);
          if (paidBy === person2) p2PaidForShared += (t.amount || 0);
        } else if (expenseFor === person2 && paidBy === person1) {
          p1PaidForP2 += (t.amount || 0);
        } else if (expenseFor === person1 && paidBy === person2) {
          p2PaidForP1 += (t.amount || 0);
        }
      }
    });

    // Abonelikleri ekle
    subscriptions.forEach((s) => {
      if (s.active !== false) {
        const paidBy = s.paidBy || (s.person === person2 ? person2 : person1);
        const expenseFor = s.expenseFor || s.person || 'Ortak';

        if (expenseFor === 'Ortak') {
          if (paidBy === person1) p1PaidForShared += (s.amount || 0);
          if (paidBy === person2) p2PaidForShared += (s.amount || 0);
        } else if (expenseFor === person2 && paidBy === person1) {
          p1PaidForP2 += (s.amount || 0);
        } else if (expenseFor === person1 && paidBy === person2) {
          p2PaidForP1 += (s.amount || 0);
        }
      }
    });

    // Net denge hesabı (Ortak harcamanın yarısı diğer eşe aittir)
    // Özkan'ın Ece'den alacağı: (Özkan'ın Ortak ödediği / 2) + Özkan'ın Ece için ödediği
    // Ece'nin Özkan'dan alacağı: (Ece'nin Ortak ödediği / 2) + Ece'nin Özkan için ödediği
    const p1Claim = (p1PaidForShared / 2) + p1PaidForP2;
    const p2Claim = (p2PaidForShared / 2) + p2PaidForP1;
    const netDifference = p1Claim - p2Claim;

    return {
      p1PaidForShared,
      p2PaidForShared,
      p1PaidForP2,
      p2PaidForP1,
      netDifference,
      creditor: netDifference > 0 ? person1 : (netDifference < 0 ? person2 : null),
      debtAmount: Math.abs(netDifference)
    };
  }, [transactions, subscriptions, currentMonthKey, person1, person2]);

  // Simülasyon Aylarını Dağıt
  const simulatedInstallments = useMemo(() => {
    const list = [];
    simulations.filter(s => s.active).forEach((sim) => {
      const count = sim.installmentCount || 1;
      const monthlyAmt = Math.round((sim.totalAmount / count) * 100) / 100;
      const [startYear, startMonth] = (sim.startMonth || currentMonthKey).split('-').map(Number);

      const monthsMap = {};
      for (let i = 0; i < count; i++) {
        const targetMonthIdx = (startMonth - 1) + i;
        const targetYear = startYear + Math.floor(targetMonthIdx / 12);
        const targetMonth = (targetMonthIdx % 12) + 1;
        const mKey = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
        monthsMap[mKey] = monthlyAmt;
      }

      list.push({
        id: sim.id,
        title: `[Simülasyon] ${sim.title}`,
        paidBy: sim.paidBy,
        expenseFor: sim.expenseFor,
        totalAmount: sim.totalAmount,
        installmentCount: count,
        months: monthsMap,
        rawSim: sim
      });
    });
    return list;
  }, [simulations, currentMonthKey]);

  // KART SAHİBİNE (ÖDEYEN KARTA) GÖRE GRUPLA
  // Çünkü banka ekstresi harcamayı yapan karta gelir!
  const groupedData = useMemo(() => {
    const cardOwners = [
      { 
        id: person1, 
        label: `${person1}'in Kartı / Hesabı`, 
        dueDay: cardSettings?.person1?.dueDay || 4, 
        cutoffDay: cardSettings?.person1?.cutoffDay || 24 
      },
      { 
        id: person2, 
        label: `${person2}'nin Kartı / Hesabı`, 
        dueDay: cardSettings?.person2?.dueDay || 20, 
        cutoffDay: cardSettings?.person2?.cutoffDay || 10 
      }
    ];

    return cardOwners.map((owner) => {
      // 1. Bu karttan ödenen taksitler (paidBy === owner.id)
      const cardInstallments = transactions.filter(
        (t) => t.isInstallment && (t.paidBy || (t.person === person2 ? person2 : person1)) === owner.id
      );

      const installmentGroups = {};
      cardInstallments.forEach((t) => {
        const rootTitle = t.title.replace(/\s*\(\d+\/\d+\)$/, '').trim();
        const expenseFor = t.expenseFor || t.person || 'Ortak';
        const groupKey = t.installmentGroupId || `${owner.id}_${rootTitle}`;
        if (!installmentGroups[groupKey]) {
          installmentGroups[groupKey] = {
            id: groupKey,
            title: rootTitle,
            expenseFor,
            category: t.category,
            totalInstallments: t.installmentTotal || 1,
            months: {}
          };
        }
        const mKey = t.date.slice(0, 7);
        installmentGroups[groupKey].months[mKey] = (installmentGroups[groupKey].months[mKey] || 0) + (t.amount || 0);
      });

      // 2. Bu karttan ödenen peşin (tek çekim) harcamalar
      const cardSingleExpenses = {};
      transactions
        .filter(
          (t) =>
            !t.isInstallment &&
            t.type === 'Gider' &&
            (t.paymentMethod || 'Kredi Kartı') === 'Kredi Kartı' &&
            (t.paidBy || (t.person === person2 ? person2 : person1)) === owner.id
        )
        .forEach((t) => {
          const expenseFor = t.expenseFor || t.person || 'Ortak';
          const key = `${t.id}`;
          const mKey = t.date ? t.date.slice(0, 7) : '';
          cardSingleExpenses[key] = {
            id: t.id,
            title: t.title,
            expenseFor,
            category: t.category,
            purchaseDate: t.purchaseDate || t.date,
            months: { [mKey]: Number(t.amount || 0) }
          };
        });

      // 3. Bu karttan ödenen abonelikler (Sadece Kredi Kartı ile ödenenler)
      const cardSubs = subscriptions.filter(
        (s) =>
          (s.paymentMethod || 'Kredi Kartı') === 'Kredi Kartı' &&
          (s.paidBy || (s.person === person2 ? person2 : person1)) === owner.id &&
          s.active !== false
      );

      // 4. Bu kartla ilişkilendirilmiş aktif simülasyonlar
      const cardSims = simulatedInstallments.filter((sim) => sim.paidBy === owner.id);

      return {
        cardOwner: owner,
        installments: Object.values(installmentGroups),
        singleCardExpenses: Object.values(cardSingleExpenses),
        subscriptions: cardSubs,
        simulations: cardSims
      };
    });
  }, [transactions, subscriptions, simulatedInstallments, person1, person2, cardSettings]);

  // Nakit / Havale ile Ödenen Abonelikler (Her Ay Sabit Nakit Çıkışı)
  const cashSubscriptions = useMemo(() => {
    return subscriptions.filter(
      (s) => s.active !== false && s.paymentMethod && s.paymentMethod !== 'Kredi Kartı'
    );
  }, [subscriptions]);

  // Nakit / Havale Harcamaları (Kredi Kartı Dışı Giderler)
  const cashExpenses = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          !t.isInstallment &&
          t.type === 'Gider' &&
          t.paymentMethod &&
          t.paymentMethod !== 'Kredi Kartı'
      )
      .map((t) => {
        const mKey = t.date ? t.date.slice(0, 7) : '';
        return {
          id: t.id,
          title: t.title,
          paidBy: t.paidBy || (t.person === person2 ? person2 : person1),
          expenseFor: t.expenseFor || t.person || 'Ortak',
          category: t.category,
          months: { [mKey]: Number(t.amount || 0) }
        };
      });
  }, [transactions, person1, person2]);

  // Sütun Toplamları
  const monthlySummary = useMemo(() => {
    return upcomingMonths.map((m) => {
      let monthCardTotal = 0;
      let monthCashTotal = 0;
      let monthSimTotal = 0;
      const ownerTotals = {};

      groupedData.forEach(({ cardOwner, installments, singleCardExpenses, subscriptions, simulations: cardSims }) => {
        let cardSum = 0;

        installments.forEach((inst) => {
          cardSum += (inst.months[m.key] || 0);
        });

        singleCardExpenses.forEach((sc) => {
          cardSum += (sc.months[m.key] || 0);
        });

        subscriptions.forEach((sub) => {
          cardSum += (sub.amount || 0);
        });

        // O karta ait simülasyonlar
        cardSims.forEach((sim) => {
          const sVal = (sim.months[m.key] || 0);
          cardSum += sVal;
          monthSimTotal += sVal;
        });

        ownerTotals[cardOwner.id] = cardSum;
        monthCardTotal += cardSum;
      });

      // Nakit harcamalar ve nakit abonelikler toplamı
      cashExpenses.forEach((ce) => {
        monthCashTotal += (ce.months[m.key] || 0);
      });

      cashSubscriptions.forEach((sub) => {
        monthCashTotal += (sub.amount || 0);
      });

      const monthExpenseTotal = monthCardTotal + monthCashTotal;
      const netSavings = totalMonthlyIncome - monthExpenseTotal;

      return {
        monthKey: m.key,
        totalCardExpense: monthCardTotal,
        totalCashExpense: monthCashTotal,
        totalExpense: monthExpenseTotal,
        monthSimTotal,
        ownerTotals,
        income: totalMonthlyIncome,
        netSavings
      };
    });
  }, [upcomingMonths, groupedData, cashExpenses, cashSubscriptions, totalMonthlyIncome]);

  // Simülasyon Ekle
  const handleAddSimulation = (e) => {
    e.preventDefault();
    const pAmt = parseFloat(simAmount);
    if (!simTitle.trim() || isNaN(pAmt) || pAmt <= 0) return;

    const newSim = {
      id: 'sim_' + Date.now(),
      title: simTitle.trim(),
      totalAmount: pAmt,
      installmentCount: parseInt(simInstallment, 10) || 1,
      paidBy: simPaidBy,
      expenseFor: simExpenseFor,
      startMonth: simStartMonth,
      active: true
    };

    setSimulations([...simulations, newSim]);
    setSimTitle('');
    setSimAmount('');
    setIsSimModalOpen(false);
  };

  // Simülasyon Durumunu Aç/Kapa
  const toggleSimulation = (id) => {
    setSimulations(simulations.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // Simülasyonu Sil
  const deleteSimulation = (id) => {
    setSimulations(simulations.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Üst Bilgi Kartları: Nakit Akışı Fazları & Kart Tavsiyesi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Faz 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              1. Faz: Ayın 25'i - 4'ü Arası
            </span>
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Bu Dönemde Giren Nakit</div>
            <div className="text-2xl font-bold text-slate-900">₺{phase1Income.toLocaleString('tr-TR')}</div>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Avans (25'i) + Ek Gelirler (27'si & 1'i)</span>
            </div>
            <div className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {person1}'in 4'ündeki kart ödemesi güvende
            </div>
          </div>
        </div>

        {/* Faz 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              2. Faz: Ayın 10'u - 20'si Arası
            </span>
            <Banknote className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Maaşın Kalanı (10'u)</div>
            <div className="text-2xl font-bold text-indigo-600">₺{phase2Income.toLocaleString('tr-TR')}</div>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Ana maaş yattıktan 10 gün sonra ödenir</span>
            </div>
            <div className="text-indigo-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {person2}'nin 20'sindeki kart ödemesi güvende
            </div>
          </div>
        </div>

        {/* Akıllı Kart Tavsiyesi */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Bugün Hangi Kart?
            </span>
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
              Bugün: Ayın {currentDay}'i
            </span>
          </div>

          <div>
            <div className="text-xs text-indigo-200">En Uzun Vadeli Alışveriş İçin:</div>
            <div className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              {cardRecommendation.bestCard}
            </div>
          </div>

          <p className="text-[11px] text-indigo-200/80 leading-relaxed">
            {cardRecommendation.reason}
          </p>
        </div>
      </div>

      {/* 2. EŞLER ARASI MAHSUPLAŞMA & HARCAMA DENGESİ (Ödeme Dengesi İçin) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Eşler Arası Ödeme Dengesi & Mahsuplaşma (Bu Ay)
            </h3>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
            Ortak harcamalar ve kart ödemeleri dengesi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium">{person1}'in Kendi Kartından Ödediği Ortak:</span>
            <div className="text-base font-bold text-slate-800">₺{balanceSummary.p1PaidForShared.toLocaleString('tr-TR')}</div>
            {balanceSummary.p1PaidForP2 > 0 && (
              <div className="text-[11px] text-indigo-600 font-medium">+{person2} için: ₺{balanceSummary.p1PaidForP2.toLocaleString('tr-TR')}</div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-medium">{person2}'nin Kendi Kartından Ödediği Ortak:</span>
            <div className="text-base font-bold text-slate-800">₺{balanceSummary.p2PaidForShared.toLocaleString('tr-TR')}</div>
            {balanceSummary.p2PaidForP1 > 0 && (
              <div className="text-[11px] text-indigo-600 font-medium">+{person1} için: ₺{balanceSummary.p2PaidForP1.toLocaleString('tr-TR')}</div>
            )}
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1">
            <span className="text-indigo-900 font-bold">Net Mahsuplaşma Durumu:</span>
            {balanceSummary.creditor ? (
              <div>
                <div className="text-base font-extrabold text-indigo-700">
                  {balanceSummary.creditor === person1 ? `${person2} ➔ ${person1}'e` : `${person1} ➔ ${person2}'ye`}
                </div>
                <div className="text-xs font-bold text-indigo-900">
                  ₺{balanceSummary.debtAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} öderse denge sağlanır
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-emerald-600 pt-1">
                ✓ Ortak ödemeler tam dengede!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BÜYÜK HARCAMA SİMÜLATÖRÜ (WHAT-IF SCENARIOS) */}
      <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white rounded-2xl border border-purple-200/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Büyük Harcama Simülatörü ("Bunu Alırsak Bütçe Nasıl Etkilenir?")
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Yekun tutacak harcamalarınızı simüle edin; matris üzerinde taksitlerin ve nakit akışınızın anlık değişimini görün.
            </p>
          </div>

          <button
            onClick={() => setIsSimModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Yeni Simülasyon Ekle
          </button>
        </div>

        {/* Simülasyon Listesi */}
        {simulations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  sim.active
                    ? 'bg-white border-purple-300 shadow-sm'
                    : 'bg-slate-100/60 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">{sim.title}</span>
                    <span className="text-[11px] text-purple-600 font-semibold">
                      ₺{Number(sim.totalAmount || 0).toLocaleString('tr-TR')} ({sim.installmentCount} Taksit)
                    </span>
                  </div>

                  <button
                    onClick={() => toggleSimulation(sim.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                      sim.active
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                    title="Simülasyonu Matrise Dahil Et / Çıkar"
                  >
                    {sim.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {sim.active ? 'Matriste Aktif' : 'Pasif'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                  <span>Kart: <strong>{sim.paidBy}'in Kartı</strong></span>
                  <span>Aylık: <strong>₺{Math.round(sim.totalAmount / sim.installmentCount).toLocaleString('tr-TR')}</strong></span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  {onConvertSimulationToTransaction && (
                    <button
                      onClick={() => onConvertSimulationToTransaction(sim)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      title="Bu harcamayı gerçek taksitli işlem olarak bütçeye ekle"
                    >
                      <Check className="w-3 h-3" /> Gerçeğe Dönüştür
                    </button>
                  )}
                  <button
                    onClick={() => deleteSimulation(sim.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors ml-auto"
                    title="Simülasyonu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DÜZENLİ GELİRLER YÖNETİMİ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Otomatik Düzenli Gelirler ({recurringIncomes.length})
            </h3>
            <p className="text-xs text-slate-400">
              Bu gelirler her ayın bütçesine otomatik eklenir. 2027 zamlarında tutarı buradan güncelleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400">Aylık Toplam Net Giriş:</span>
              <div className="text-base font-bold text-emerald-600">
                ₺{totalMonthlyIncome.toLocaleString('tr-TR')}
              </div>
            </div>
            <button
              onClick={onOpenAddIncomeModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Gelir Ekle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recurringIncomes.map((inc) => (
            <div
              key={inc.id}
              className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all space-y-2 relative group"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-bold text-slate-800 truncate">{inc.title}</span>
                <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                  +₺{Number(inc.amount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium text-slate-600">
                  Her ayın {inc.day}. günü
                </span>
                <span className="font-semibold text-indigo-600">{inc.person}</span>
              </div>
              <div className="flex justify-end gap-1 pt-1 opacity-90 group-hover:opacity-100">
                <button
                  onClick={() => onEditIncome(inc)}
                  className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                  title="Geliri Güncelle (2027 Zamları vb.)"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteIncome(inc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TAKSİT VE ÖDEME MATRİS TABLOSU (SÜTUNLARDA AYLAR, SATIRLARDA ÖDEYEN KART GRUPLARI) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-indigo-600" /> Taksit & Ödeme Matrisi (Kredi Kartı Ekstre Yükleri)
            </h2>
            <p className="text-xs text-slate-400">
              Satırlar ödemenin çekildiği <strong>Karta göre</strong> gruplanmıştır. Harcamanın kime ait olduğu parantez içinde belirtilir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Projeksiyon:</span>
            <select
              value={viewMonthsCount}
              onChange={(e) => setViewMonthsCount(parseInt(e.target.value, 10))}
              className="p-1.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={4}>4 Ay</option>
              <option value={6}>6 Ay</option>
              <option value={9}>9 Ay</option>
              <option value={12}>12 Ay (1 Yıl)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3 font-bold sticky left-0 bg-slate-50 z-10 min-w-[240px]">
                  Ödeme Kalemi & Harcama Türü
                </th>
                {upcomingMonths.map((m, idx) => (
                  <th key={m.key} className="p-3 text-right font-bold whitespace-nowrap min-w-[110px]">
                    {m.label}
                    {idx === 0 && <span className="block text-[10px] text-indigo-600 font-medium">(Bu Ay)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedData.map(({ cardOwner, installments, singleCardExpenses, subscriptions, simulations: cardSims }) => {
                const hasItems = installments.length > 0 || singleCardExpenses.length > 0 || subscriptions.length > 0 || cardSims.length > 0;

                return (
                  <React.Fragment key={cardOwner.id}>
                    {/* Kart Sahibi Grup Başlığı */}
                    <tr className="bg-slate-100/80 font-bold text-slate-800">
                      <td colSpan={upcomingMonths.length + 1} className="p-2.5 px-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-slate-900">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            {cardOwner.label}
                            {cardOwner.dueDay && (
                              <span className="text-[11px] font-normal text-slate-500">
                                (Hesap Kesim: {cardOwner.cutoffDay}'u / Son Ödeme: Her ayın {cardOwner.dueDay}'i)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Bu Karttan Ödenen Taksitler */}
                    {installments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="p-2.5 px-4 font-medium sticky left-0 bg-white">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="truncate max-w-[180px]" title={inst.title}>{inst.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal shrink-0">
                              {inst.expenseFor === 'Ortak' ? 'Ortak' : inst.expenseFor}
                            </span>
                          </div>
                        </td>
                        {upcomingMonths.map((m) => {
                          const val = inst.months[m.key] || 0;
                          return (
                            <td key={m.key} className="p-2.5 text-right font-mono">
                              {val > 0 ? `₺${val.toLocaleString('tr-TR')}` : <span className="text-slate-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Bu Karttan Ödenen Tek Çekim (Peşin) Harcamalar */}
                    {singleCardExpenses.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="p-2.5 px-4 font-medium sticky left-0 bg-white">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="truncate max-w-[160px]" title={sc.title}>{sc.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold shrink-0">
                              Tek Çekim
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal shrink-0">
                              {sc.expenseFor === 'Ortak' ? 'Ortak' : sc.expenseFor}
                            </span>
                          </div>
                        </td>
                        {upcomingMonths.map((m) => {
                          const val = sc.months[m.key] || 0;
                          return (
                            <td key={m.key} className="p-2.5 text-right font-mono text-amber-800">
                              {val > 0 ? `₺${val.toLocaleString('tr-TR')}` : <span className="text-slate-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Bu Karttan Ödenen Abonelikler */}
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 text-slate-700">
                        <td className="p-2.5 px-4 font-medium sticky left-0 bg-white">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                            <span className="truncate max-w-[180px]" title={sub.title}>{sub.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-normal shrink-0">
                              {sub.expenseFor === 'Ortak' ? 'Ortak' : sub.expenseFor}
                            </span>
                          </div>
                        </td>
                        {upcomingMonths.map((m) => (
                          <td key={m.key} className="p-2.5 text-right font-mono text-purple-700">
                            ₺{Number(sub.amount || 0).toLocaleString('tr-TR')}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Bu Karta Ait Simüle Edilen Harcamalar */}
                    {cardSims.map((sim) => (
                      <tr key={sim.id} className="bg-purple-50/40 text-purple-900 border-l-4 border-purple-500">
                        <td className="p-2.5 px-4 font-bold sticky left-0 bg-purple-50/90">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate max-w-[180px]">{sim.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 font-normal shrink-0">
                              {sim.expenseFor}
                            </span>
                          </div>
                        </td>
                        {upcomingMonths.map((m) => {
                          const val = sim.months[m.key] || 0;
                          return (
                            <td key={m.key} className="p-2.5 text-right font-mono font-bold text-purple-700">
                              {val > 0 ? `₺${val.toLocaleString('tr-TR')}` : <span className="text-slate-300">-</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {!hasItems && (
                      <tr>
                        <td colSpan={upcomingMonths.length + 1} className="p-2 px-6 text-slate-400 italic text-[11px]">
                          Bu karta ait aktif taksit, abonelik veya simülasyon bulunmuyor.
                        </td>
                      </tr>
                    )}

                    {/* Karta Ait Aylık Alt Toplam */}
                    <tr className="bg-indigo-50/30 font-bold border-b-2 border-slate-200">
                      <td className="p-2.5 px-4 text-indigo-950 sticky left-0 bg-indigo-50/30">
                        ↳ {cardOwner.id}'in Kart Ekstre Yükü
                      </td>
                      {upcomingMonths.map((m, idx) => {
                        const sum = monthlySummary[idx]?.ownerTotals[cardOwner.id] || 0;
                        return (
                          <td key={m.key} className="p-2.5 text-right font-mono text-indigo-900">
                            ₺{sum.toLocaleString('tr-TR')}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* NAKİT / HAVALE HARCAMALARI GRUBU VE ALT TOPLAMI */}
              <tr className="bg-amber-50/60 font-bold text-slate-800">
                <td colSpan={upcomingMonths.length + 1} className="p-2.5 px-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-900">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Nakit / Havale Harcamaları
                    <span className="text-[11px] font-normal text-slate-500">
                      (Kredi kartı dışı doğrudan nakit çıkışları ve nakit abonelikler)
                    </span>
                  </span>
                </td>
              </tr>

              {cashSubscriptions.map((sub) => {
                const subPaidBy = sub.paidBy || (sub.person === person2 ? person2 : person1);
                const subExpenseFor = sub.expenseFor || sub.person || 'Ortak';
                return (
                  <tr key={`cash_sub_${sub.id}`} className="hover:bg-slate-50/50 text-slate-700">
                    <td className="p-2.5 px-4 font-medium sticky left-0 bg-white">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                        <span className="truncate max-w-[150px]" title={sub.title}>{sub.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold shrink-0">
                          {subPaidBy} (Nakit Abonelik)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal shrink-0">
                          {subExpenseFor === 'Ortak' ? 'Ortak' : subExpenseFor}
                        </span>
                      </div>
                    </td>
                    {upcomingMonths.map((m) => (
                      <td key={m.key} className="p-2.5 text-right font-mono text-emerald-800">
                        ₺{Number(sub.amount || 0).toLocaleString('tr-TR')}
                      </td>
                    ))}
                  </tr>
                );
              })}

              {cashExpenses.map((ce) => (
                <tr key={ce.id} className="hover:bg-slate-50/50 text-slate-700">
                  <td className="p-2.5 px-4 font-medium sticky left-0 bg-white">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="truncate max-w-[160px]" title={ce.title}>{ce.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold shrink-0">
                        {ce.paidBy} (Nakit)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-normal shrink-0">
                        {ce.expenseFor === 'Ortak' ? 'Ortak' : ce.expenseFor}
                      </span>
                    </div>
                  </td>
                  {upcomingMonths.map((m) => {
                    const val = ce.months[m.key] || 0;
                    return (
                      <td key={m.key} className="p-2.5 text-right font-mono text-emerald-800">
                        {val > 0 ? `₺${val.toLocaleString('tr-TR')}` : <span className="text-slate-300">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {cashExpenses.length === 0 && cashSubscriptions.length === 0 && (
                <tr>
                  <td colSpan={upcomingMonths.length + 1} className="p-2 px-6 text-slate-400 italic text-[11px]">
                    Kayıtlı nakit harcama veya nakit abonelik bulunmuyor.
                  </td>
                </tr>
              )}

              <tr className="bg-amber-50/40 font-bold border-b-2 border-slate-200">
                <td className="p-2.5 px-4 text-amber-950 sticky left-0 bg-amber-50/40">
                  ↳ Aylık Nakit Harcamalar Alt Toplamı
                </td>
                {monthlySummary.map((s) => (
                  <td key={s.monthKey} className="p-2.5 text-right font-mono text-amber-900">
                    ₺{s.totalCashExpense.toLocaleString('tr-TR')}
                  </td>
                ))}
              </tr>

              {/* GENEL AYLIK GİDER TOPLAMI */}
              <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                <td className="p-3 sticky left-0 bg-slate-100 text-xs">
                  🔴 TOPLAM AYLIK KART + NAKİT GİDER YÜKÜ
                </td>
                {monthlySummary.map((s) => (
                  <td key={s.monthKey} className="p-3 text-right font-mono text-rose-600 text-xs">
                    ₺{s.totalExpense.toLocaleString('tr-TR')}
                  </td>
                ))}
              </tr>

              {/* DÜZENLİ GELİRLER SATIRI */}
              <tr className="bg-emerald-50/50 font-extrabold text-emerald-900 border-b border-emerald-100">
                <td className="p-3 sticky left-0 bg-emerald-50/50 text-xs">
                  🟢 TOPLAM DÜZENLİ GELİR
                </td>
                {monthlySummary.map((s) => (
                  <td key={s.monthKey} className="p-3 text-right font-mono text-emerald-700 text-xs">
                    ₺{s.income.toLocaleString('tr-TR')}
                  </td>
                ))}
              </tr>

              {/* CEPTE KALAN / BİRİKİM POTANSİYELİ */}
              <tr className="bg-emerald-100/70 font-black text-emerald-950">
                <td className="p-3 sticky left-0 bg-emerald-100/70 text-xs">
                  💎 CEPTE KALAN (NET BİRİKİM)
                </td>
                {monthlySummary.map((s) => {
                  const isPositive = s.netSavings >= 0;
                  return (
                    <td
                      key={s.monthKey}
                      className={`p-3 text-right font-mono text-xs ${
                        isPositive ? 'text-emerald-900' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}₺{s.netSavings.toLocaleString('tr-TR')}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* YENİ SİMÜLASYON EKLEME MODALI */}
      {isSimModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" /> Büyük Harcama Simülasyonu
                </h3>
                <p className="text-xs text-slate-400">
                  Planladığınız büyük harcamanın bütçenizi nasıl etkileyeceğini görün.
                </p>
              </div>
              <button
                onClick={() => setIsSimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSimulation} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Planlanan Harcama Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Yeni Televizyon, Tatil Rezervasyonu, Koltuk"
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Toplam Tutar (₺)</label>
                <input
                  type="number"
                  step="100"
                  placeholder="0.00"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Taksit Sayısı</label>
                  <select
                    value={simInstallment}
                    onChange={(e) => setSimInstallment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 9, 10, 12].map((n) => (
                      <option key={n} value={n}>{n} Taksit {n === 1 ? '(Tek Çekim)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Hangi Kartla?</label>
                  <select
                    value={simPaidBy}
                    onChange={(e) => setSimPaidBy(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value={person1}>{person1}'in Kartı</option>
                    <option value={person2}>{person2}'nin Kartı</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Harcama Sahibi</label>
                  <select
                    value={simExpenseFor}
                    onChange={(e) => setSimExpenseFor(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Ortak">Ev / Ortak</option>
                    <option value={person1}>{person1}</option>
                    <option value={person2}>{person2}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç Ayı</label>
                  <input
                    type="month"
                    value={simStartMonth}
                    onChange={(e) => setSimStartMonth(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    required
                  />
                </div>
              </div>

              {simAmount > 0 && (
                <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex justify-between font-bold">
                  <span>Aylık Kart Yansıması:</span>
                  <span>₺{(parseFloat(simAmount) / (parseInt(simInstallment, 10) || 1)).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} / ay</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Simülasyonu Matrise Ekle
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
