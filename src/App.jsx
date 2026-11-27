import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

import { db, isFirebaseActive } from './services/firebase';
import { INITIAL_CATEGORIES, DEFAULT_PERSONS } from './constants/categories';
import { DEFAULT_RECURRING_INCOMES, DEFAULT_CARD_SETTINGS } from './constants/incomes';
import { getCardConfigForOwner, calculateFirstDueDate, generateInstallmentDueDates } from './utils/cardBilling';

import Navbar from './components/Navbar';
import PeriodSelector from './components/PeriodSelector';
import ReportFilterBar from './components/ReportFilterBar';
import Dashboard from './components/Dashboard';
import TransactionsTable from './components/TransactionsTable';
import PaymentPlanTab from './components/PaymentPlanTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import SubscriptionModal from './components/SubscriptionModal';
import RecurringIncomeModal from './components/RecurringIncomeModal';
import BudgetLimits from './components/BudgetLimits';
import SettingsTab from './components/SettingsTab';
import TransactionModal from './components/TransactionModal';
import Toast from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [recurringIncomes, setRecurringIncomes] = useState([]);
  const [cardSettings, setCardSettings] = useState(DEFAULT_CARD_SETTINGS);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Rapor Ekranları Ortak Filtre State'i
  const INITIAL_FILTERS = {
    expenseFor: 'Hepsi',
    paidBy: 'Hepsi',
    paymentMethod: 'Hepsi',
    type: 'Hepsi',
    category: 'Hepsi',
    search: ''
  };
  const [reportFilters, setReportFilters] = useState(INITIAL_FILTERS);
  const handleResetFilters = () => setReportFilters(INITIAL_FILTERS);

  // Çift seed ve otomatik mükerrer temizleme korumaları
  const hasSeededIncomesRef = useRef(false);
  const hasDedupedIncomesRef = useRef(false);

  // Profil & Kategori Limitleri State'leri
  const [person1, setPerson1] = useState(() => localStorage.getItem('p1_name') || DEFAULT_PERSONS.person1);
  const [person2, setPerson2] = useState(() => localStorage.getItem('p2_name') || DEFAULT_PERSONS.person2);
  const [categoryLimits, setCategoryLimits] = useState(() => {
    const saved = localStorage.getItem('category_limits');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES.Gider;
  });

  // Modaller
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);

  // Firestore Ayarlarını Dinleme (Bulut Senkronizasyonu)
  useEffect(() => {
    if (isFirebaseActive && db) {
      const settingsDocRef = doc(db, 'settings', 'general');
      const unsubscribeSettings = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.person1) {
              setPerson1(data.person1);
              localStorage.setItem('p1_name', data.person1);
            }
            if (data.person2) {
              setPerson2(data.person2);
              localStorage.setItem('p2_name', data.person2);
            }
            if (data.categoryLimits && Array.isArray(data.categoryLimits)) {
              setCategoryLimits(data.categoryLimits);
              localStorage.setItem('category_limits', JSON.stringify(data.categoryLimits));
            }
            if (data.cardSettings) {
              setCardSettings(data.cardSettings);
              localStorage.setItem('card_settings', JSON.stringify(data.cardSettings));
            }
          } else {
            setDoc(settingsDocRef, {
              person1,
              person2,
              categoryLimits,
              cardSettings: DEFAULT_CARD_SETTINGS,
              createdAt: new Date().toISOString()
            }, { merge: true }).catch((err) => console.warn("Varsayılan ayarlar buluta yüklenemedi:", err));
          }
        },
        (error) => {
          console.warn("Bulut ayarları dinleme hatası:", error);
        }
      );

      return () => unsubscribeSettings();
    } else {
      const savedCards = localStorage.getItem('card_settings');
      if (savedCards) {
        try { setCardSettings(JSON.parse(savedCards)); } catch(e) {}
      }
    }
  }, [isFirebaseActive]);

  // Firestore Düzenli Gelirleri Dinleme & LocalStorage Fallback ("Kayınpeder Emekli Maaşı" -> "Ek Gelir" + mükerrer temizleme)
  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'recurring_incomes'), orderBy('day', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const seenKeys = new Set();
            const duplicateDocIds = [];
            const data = [];

            snapshot.docs.forEach((d) => {
              const raw = d.data();
              const item = { ...raw, id: d.id }; // Gerçek Firestore d.id her zaman baskın!

              // "Kayınpeder Emekli Maaşı" ifadesini "Ek Gelir" olarak güncelle
              if (item.title && item.title.includes('Kayınpeder Emekli')) {
                const cleanedTitle = item.title.replace('Kayınpeder Emekli Maaşı', 'Ek Gelir');
                item.title = cleanedTitle;
                updateDoc(doc(db, 'recurring_incomes', d.id), { title: cleanedTitle }).catch(() => {});
              }

              // Eski addDoc bug'ından kalma mükerrer gelirleri tespit et (aynı başlık + gün + tutar)
              const dedupKey = `${(item.title || '').trim().toLowerCase()}|${item.day}|${item.amount}`;
              if (seenKeys.has(dedupKey)) {
                duplicateDocIds.push(d.id);
              } else {
                seenKeys.add(dedupKey);
                data.push(item);
              }
            });

            // Mükerrer kayıtları Firestore'dan otomatik temizle (tek seferlik)
            if (duplicateDocIds.length > 0 && !hasDedupedIncomesRef.current) {
              hasDedupedIncomesRef.current = true;
              duplicateDocIds.forEach((dupId) => {
                deleteDoc(doc(db, 'recurring_incomes', dupId)).catch(() => {});
              });
            }

            setRecurringIncomes(data);
            localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(data));
          } else if (!hasSeededIncomesRef.current) {
            hasSeededIncomesRef.current = true;
            // setDoc + deterministik ID kullanarak çift kayıt oluşmasını kesin olarak önle
            DEFAULT_RECURRING_INCOMES.forEach(({ id: docId, ...cleanInc }) => {
              setDoc(doc(db, 'recurring_incomes', docId), cleanInc).catch(() => {});
            });
            setRecurringIncomes(DEFAULT_RECURRING_INCOMES);
            localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(DEFAULT_RECURRING_INCOMES));
          } else {
            setRecurringIncomes([]);
            localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify([]));
          }
        },
        (error) => {
          console.warn("Düzenli gelirler okuma hatası:", error);
        }
      );
      return () => unsubscribe();
    } else {
      const localInc = localStorage.getItem('ev_butcesi_recurring_incomes');
      if (localInc) {
        try {
          const parsed = JSON.parse(localInc).map(item => ({
            ...item,
            title: item.title ? item.title.replace('Kayınpeder Emekli Maaşı', 'Ek Gelir') : item.title
          }));
          setRecurringIncomes(parsed);
        } catch (e) {}
      } else {
        setRecurringIncomes(DEFAULT_RECURRING_INCOMES);
        localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(DEFAULT_RECURRING_INCOMES));
      }
    }
  }, [isFirebaseActive]);

  // Firestore İşlemleri Dinleme & LocalStorage Fallback
  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          setTransactions(data);
        },
        (error) => {
          console.error("Firestore veri okuma hatası:", error);
          setToast({ message: 'Veri senkronizasyonunda sorun oluştu.', type: 'error' });
        }
      );
      return () => unsubscribe();
    } else {
      const localData = localStorage.getItem('ev_butcesi_data');
      if (localData) {
        try {
          setTransactions(JSON.parse(localData));
        } catch (e) {
          console.error("Local veri ayrıştırma hatası:", e);
        }
      } else {
        const demoData = [
          { id: '1', title: 'Ev Kirası', amount: 18000, type: 'Gider', category: 'Kira / Ev', person: 'Ortak', expenseFor: 'Ortak', paidBy: person1, paymentMethod: 'Nakit', date: `${selectedMonth}-02` },
          { id: '2', title: 'Mutfak Alışverişi', amount: 4800, type: 'Gider', category: 'Mutfak / Market', person: person2, expenseFor: 'Ortak', paidBy: person2, paymentMethod: 'Kredi Kartı', date: `${selectedMonth}-05` },
        ];
        setTransactions(demoData);
        localStorage.setItem('ev_butcesi_data', JSON.stringify(demoData));
      }
    }
  }, [isFirebaseActive, person1, person2, selectedMonth]);

  // Firestore Abonelikleri Dinleme & LocalStorage Fallback
  useEffect(() => {
    if (isFirebaseActive && db) {
      const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          setSubscriptions(data);
          localStorage.setItem('ev_butcesi_subscriptions', JSON.stringify(data));
        },
        (error) => {
          console.warn("Abonelik okuma uyarısı:", error);
        }
      );
      return () => unsubscribe();
    } else {
      const localSubs = localStorage.getItem('ev_butcesi_subscriptions');
      if (localSubs) {
        try { setSubscriptions(JSON.parse(localSubs)); } catch (e) {}
      } else {
        const demoSubs = [
          { id: 'sub-1', title: 'Netflix', amount: 250, category: 'Eğlence / Sosyal', person: 'Ortak', expenseFor: 'Ortak', paidBy: person1, paymentMethod: 'Kredi Kartı', billingDay: 15, active: true },
          { id: 'sub-2', title: 'Spotify', amount: 90, category: 'Eğlence / Sosyal', person: person1, expenseFor: person1, paidBy: person1, paymentMethod: 'Kredi Kartı', billingDay: 5, active: true },
          { id: 'sub-3', title: 'Ev İnterneti', amount: 450, category: 'Faturalar', person: 'Ortak', expenseFor: 'Ortak', paidBy: person2, paymentMethod: 'Kredi Kartı', billingDay: 1, active: true },
        ];
        setSubscriptions(demoSubs);
        localStorage.setItem('ev_butcesi_subscriptions', JSON.stringify(demoSubs));
      }
    }
  }, [isFirebaseActive, person1, person2]);

  // Modal Açma / Kapatma İşlemleri
  const handleOpenAddModal = () => { setEditingTransaction(null); setIsModalOpen(true); };
  const handleOpenEditModal = (tx) => { setEditingTransaction(tx); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingTransaction(null); };

  const handleOpenAddSubModal = () => { setEditingSubscription(null); setIsSubModalOpen(true); };
  const handleOpenEditSubModal = (sub) => { setEditingSubscription(sub); setIsSubModalOpen(true); };
  const handleCloseSubModal = () => { setIsSubModalOpen(false); setEditingSubscription(null); };

  const handleOpenAddIncomeModal = () => { setEditingIncome(null); setIsIncomeModalOpen(true); };
  const handleOpenEditIncomeModal = (inc) => { setEditingIncome(inc); setIsIncomeModalOpen(true); };
  const handleCloseIncomeModal = () => { setIsIncomeModalOpen(false); setEditingIncome(null); };

  // İşlem Ekleme / Güncelleme (Harcama Sahibi & Ödeyen Kart & Taksit Desteği)
  const handleSaveTransaction = async (txData) => {
    try {
      if (editingTransaction) {
        const payload = { ...txData, updatedAt: new Date().toISOString() };
        if (isFirebaseActive && db) {
          await updateDoc(doc(db, 'transactions', editingTransaction.id), payload);
          // Eğer bu işlem bir taksit grubuna aitse, gruptaki diğer taksitlerin kart/sahip/kategori bilgilerini de senkronize et
          if (editingTransaction.installmentGroupId) {
            const siblings = transactions.filter(
              (t) => t.installmentGroupId === editingTransaction.installmentGroupId && t.id !== editingTransaction.id
            );
            for (const sib of siblings) {
              await updateDoc(doc(db, 'transactions', sib.id), {
                paidBy: txData.paidBy,
                expenseFor: txData.expenseFor,
                person: txData.expenseFor || txData.person || 'Ortak',
                category: txData.category,
                updatedAt: new Date().toISOString()
              });
            }
          }
        } else {
          const updated = transactions.map((t) => {
            if (t.id === editingTransaction.id) return { ...t, ...payload };
            if (editingTransaction.installmentGroupId && t.installmentGroupId === editingTransaction.installmentGroupId) {
              return {
                ...t,
                paidBy: txData.paidBy,
                expenseFor: txData.expenseFor,
                person: txData.expenseFor || txData.person || 'Ortak',
                category: txData.category,
                updatedAt: new Date().toISOString()
              };
            }
            return t;
          });
          setTransactions(updated);
          localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
        }
        setToast({ message: 'İşlem başarıyla güncellendi.', type: 'success' });
      } else {
        if (txData.type === 'Gider' && txData.paymentMethod === 'Kredi Kartı' && txData.isInstallment && txData.installmentCount > 1) {
          const count = txData.installmentCount;
          const totalAmount = txData.amount;
          const monthlyAmount = Math.round((totalAmount / count) * 100) / 100;
          const groupId = 'inst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

          const cardOwner = txData.paidBy || person1;
          const { cutoffDay, dueDay } = getCardConfigForOwner(cardOwner, person1, person2, cardSettings);
          const dueDates = generateInstallmentDueDates(txData.date, count, cutoffDay, dueDay);
          const newInstallmentDocs = [];

          for (let i = 0; i < count; i++) {
            const targetDateStr = dueDates[i];

            const finalAmt = (i === count - 1)
              ? Number((totalAmount - (monthlyAmount * (count - 1))).toFixed(2))
              : monthlyAmount;

            newInstallmentDocs.push({
              title: `${txData.title} (${i + 1}/${count})`,
              amount: finalAmt,
              type: 'Gider',
              category: txData.category,
              person: txData.expenseFor || txData.person || 'Ortak',
              expenseFor: txData.expenseFor || 'Ortak',
              paidBy: cardOwner,
              date: targetDateStr,
              purchaseDate: txData.date,
              paymentMethod: 'Kredi Kartı',
              isInstallment: true,
              installmentIndex: i + 1,
              installmentTotal: count,
              installmentGroupId: groupId,
              createdAt: new Date().toISOString()
            });
          }

          if (isFirebaseActive && db) {
            for (const item of newInstallmentDocs) {
              await addDoc(collection(db, 'transactions'), item);
            }
          } else {
            const addedWithIds = newInstallmentDocs.map((item, idx) => ({ ...item, id: `${Date.now()}_${idx}` }));
            const updated = [...addedWithIds, ...transactions];
            setTransactions(updated);
            localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
          }

          setToast({ message: `${count} aylık kredi kartı taksiti (${txData.paidBy}'in kartına) oluşturuldu.`, type: 'success' });
        } else {
          let finalDate = txData.date;
          let purchaseDate = txData.date;
          if (txData.type === 'Gider' && txData.paymentMethod === 'Kredi Kartı') {
            const cardOwner = txData.paidBy || person1;
            const { cutoffDay, dueDay } = getCardConfigForOwner(cardOwner, person1, person2, cardSettings);
            finalDate = calculateFirstDueDate(txData.date, cutoffDay, dueDay);
          }
          const payload = {
            ...txData,
            date: finalDate,
            ...(txData.type === 'Gider' && txData.paymentMethod === 'Kredi Kartı' ? { purchaseDate } : {}),
            createdAt: new Date().toISOString()
          };
          if (isFirebaseActive && db) {
            await addDoc(collection(db, 'transactions'), payload);
          } else {
            const updated = [{ ...payload, id: Date.now().toString() }, ...transactions];
            setTransactions(updated);
            localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
          }
          setToast({ message: 'İşlem başarıyla eklendi.', type: 'success' });
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error("İşlem kaydetme hatası:", error);
      setToast({ message: 'İşlem kaydedilirken hata oluştu.', type: 'error' });
    }
  };

  // Simülasyonu Gerçek Harcamaya Dönüştürme
  const handleConvertSimulationToTransaction = async (sim) => {
    const count = sim.installmentCount || 1;
    const isInst = count > 1;
    const startDay = '05';
    const startDate = `${sim.startMonth || selectedMonth}-${startDay}`;

    await handleSaveTransaction({
      title: sim.title,
      amount: sim.totalAmount,
      type: 'Gider',
      category: 'Diğer Giderler',
      person: sim.expenseFor || 'Ortak',
      expenseFor: sim.expenseFor || 'Ortak',
      paidBy: sim.paidBy || person1,
      paymentMethod: 'Kredi Kartı',
      isInstallment: isInst,
      installmentCount: count,
      date: startDate
    });

    setToast({
      message: `"${sim.title}" başarıyla gerçek bütçeye taksitli olarak aktarıldı!`,
      type: 'success'
    });
  };

  // İşlem Silme
  const handleDeleteTransaction = async (id) => {
    try {
      if (isFirebaseActive && db) {
        await deleteDoc(doc(db, 'transactions', id));
      } else {
        const updated = transactions.filter((t) => t.id !== id);
        setTransactions(updated);
        localStorage.setItem('ev_butcesi_data', JSON.stringify(updated));
      }
      setToast({ message: 'İşlem silindi.', type: 'success' });
    } catch (error) {
      setToast({ message: 'İşlem silinirken hata oluştu.', type: 'error' });
    }
  };

  // Abonelik Kaydetme / Güncelleme
  const handleSaveSubscription = async (subData) => {
    try {
      if (editingSubscription) {
        const payload = { ...subData, updatedAt: new Date().toISOString() };
        if (isFirebaseActive && db) {
          await updateDoc(doc(db, 'subscriptions', editingSubscription.id), payload);
        } else {
          const updated = subscriptions.map((s) => s.id === editingSubscription.id ? { ...s, ...payload } : s);
          setSubscriptions(updated);
          localStorage.setItem('ev_butcesi_subscriptions', JSON.stringify(updated));
        }
        setToast({ message: 'Abonelik güncellendi.', type: 'success' });
      } else {
        const payload = { ...subData, createdAt: new Date().toISOString() };
        if (isFirebaseActive && db) {
          await addDoc(collection(db, 'subscriptions'), payload);
        } else {
          const updated = [{ ...payload, id: 'sub_' + Date.now() }, ...subscriptions];
          setSubscriptions(updated);
          localStorage.setItem('ev_butcesi_subscriptions', JSON.stringify(updated));
        }
        setToast({ message: 'Yeni abonelik eklendi ve her aya yansıtıldı.', type: 'success' });
      }
      handleCloseSubModal();
    } catch (error) {
      setToast({ message: 'Abonelik kaydedilemedi.', type: 'error' });
    }
  };

  // Abonelik Silme
  const handleDeleteSubscription = async (id) => {
    if (!window.confirm('Bu aboneliği silmek istediğinize emin misiniz?')) return;
    try {
      if (isFirebaseActive && db) {
        await deleteDoc(doc(db, 'subscriptions', id));
      } else {
        const updated = subscriptions.filter((s) => s.id !== id);
        setSubscriptions(updated);
        localStorage.setItem('ev_butcesi_subscriptions', JSON.stringify(updated));
      }
      setToast({ message: 'Abonelik silindi.', type: 'success' });
    } catch (error) {
      setToast({ message: 'Silme hatası oluştu.', type: 'error' });
    }
  };

  // Düzenli Gelir Kaydetme / Güncelleme
  const handleSaveRecurringIncome = async (incData) => {
    try {
      if (editingIncome) {
        const payload = { ...incData, updatedAt: new Date().toISOString() };
        if (isFirebaseActive && db) {
          await updateDoc(doc(db, 'recurring_incomes', editingIncome.id), payload);
        } else {
          const updated = recurringIncomes.map((i) => i.id === editingIncome.id ? { ...i, ...payload } : i);
          setRecurringIncomes(updated);
          localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(updated));
        }
        setToast({ message: 'Düzenli gelir tutarı güncellendi.', type: 'success' });
      } else {
        const payload = { ...incData, createdAt: new Date().toISOString() };
        if (isFirebaseActive && db) {
          await addDoc(collection(db, 'recurring_incomes'), payload);
        } else {
          const updated = [{ ...payload, id: 'inc_' + Date.now() }, ...recurringIncomes];
          setRecurringIncomes(updated);
          localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(updated));
        }
        setToast({ message: 'Yeni düzenli gelir eklendi.', type: 'success' });
      }
      handleCloseIncomeModal();
    } catch (error) {
      setToast({ message: 'Gelir kaydedilemedi.', type: 'error' });
    }
  };

  // Düzenli Gelir Silme
  const handleDeleteRecurringIncome = async (id) => {
    if (!window.confirm('Bu düzenli geliri silmek istediğinize emin misiniz?')) return;
    try {
      if (isFirebaseActive && db) {
        await deleteDoc(doc(db, 'recurring_incomes', id));
      } else {
        const updated = recurringIncomes.filter((i) => i.id !== id);
        setRecurringIncomes(updated);
        localStorage.setItem('ev_butcesi_recurring_incomes', JSON.stringify(updated));
      }
      setToast({ message: 'Düzenli gelir silindi.', type: 'success' });
    } catch (error) {
      setToast({ message: 'Gelir silinemedi.', type: 'error' });
    }
  };

  // Ayarları Kaydetme
  const handleSaveSettings = async ({ person1: p1, person2: p2, limits, cardSettings: cSettings }) => {
    setIsSavingSettings(true);
    try {
      setPerson1(p1);
      setPerson2(p2);
      setCategoryLimits(limits);
      if (cSettings) setCardSettings(cSettings);

      localStorage.setItem('p1_name', p1);
      localStorage.setItem('p2_name', p2);
      localStorage.setItem('category_limits', JSON.stringify(limits));
      if (cSettings) localStorage.setItem('card_settings', JSON.stringify(cSettings));

      if (isFirebaseActive && db) {
        const settingsDocRef = doc(db, 'settings', 'general');
        await setDoc(settingsDocRef, {
          person1: p1,
          person2: p2,
          categoryLimits: limits,
          cardSettings: cSettings || cardSettings,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        setToast({ message: 'Ayarlar ve kart tarihleri buluta senkronize edildi!', type: 'success' });
      } else {
        setToast({ message: 'Ayarlar yerel olarak kaydedildi!', type: 'success' });
      }
    } catch (error) {
      setToast({ message: 'Ayarlar kaydedilemedi.', type: 'error' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Dönem Filtrelemesi + Otomatik Düzenli Gelirler + Abonelikler
  const monthTransactions = useMemo(() => {
    const baseMonthTx = transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));

    const [y, m] = selectedMonth.split('-').map(Number);
    const maxDays = new Date(y, m, 0).getDate();

    // Dinamik Aktif Abonelikler (Gider)
    const subscriptionTx = subscriptions
      .filter((s) => s.active !== false)
      .map((sub) => {
        const day = Math.min(sub.billingDay || 1, maxDays);
        return {
          id: `sub_${sub.id}_${selectedMonth}`,
          subscriptionId: sub.id,
          title: sub.title,
          amount: sub.amount,
          type: 'Gider',
          category: sub.category,
          person: sub.expenseFor || sub.person || 'Ortak',
          expenseFor: sub.expenseFor || sub.person || 'Ortak',
          paidBy: sub.paidBy || person1,
          paymentMethod: sub.paymentMethod || 'Kredi Kartı',
          date: `${selectedMonth}-${String(day).padStart(2, '0')}`,
          isSubscription: true
        };
      });

    // Dinamik Düzenli Gelirler
    const recurringIncomeTx = recurringIncomes
      .filter((inc) => inc.active !== false)
      .map((inc) => {
        const day = Math.min(inc.day || 1, maxDays);
        return {
          id: `inc_${inc.id}_${selectedMonth}`,
          incomeId: inc.id,
          rawIncome: inc,
          title: inc.title,
          amount: inc.amount,
          type: 'Gelir',
          category: 'Maaş',
          person: inc.person || 'Ortak',
          expenseFor: inc.person || 'Ortak',
          paidBy: inc.person || 'Ortak',
          paymentMethod: 'Nakit',
          date: `${selectedMonth}-${String(day).padStart(2, '0')}`,
          isRecurringIncome: true
        };
      });

    return [...baseMonthTx, ...subscriptionTx, ...recurringIncomeTx].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, subscriptions, recurringIncomes, selectedMonth, person1]);

  // Rapor Filtresi İçin Mevcut Tüm Kategoriler
  const availableCategories = useMemo(() => {
    const set = new Set(categoryLimits.map((c) => c.name));
    monthTransactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [categoryLimits, monthTransactions]);

  // Rapor Ekranları İçin Ortak Filtrelenmiş İşlemler (Dashboard, Gelir & Giderler, Bütçe Limitleri)
  const filteredMonthTransactions = useMemo(() => {
    const q = reportFilters.search.trim().toLowerCase();
    return monthTransactions.filter((t) => {
      const expFor = t.expenseFor || t.person || 'Ortak';
      const paidBy = t.paidBy || (t.person === person2 ? person2 : person1);
      const pm = t.paymentMethod || 'Nakit';

      if (reportFilters.expenseFor !== 'Hepsi' && expFor !== reportFilters.expenseFor) return false;
      if (reportFilters.paidBy !== 'Hepsi' && paidBy !== reportFilters.paidBy) return false;
      if (reportFilters.paymentMethod !== 'Hepsi' && pm !== reportFilters.paymentMethod) return false;
      if (reportFilters.type !== 'Hepsi' && t.type !== reportFilters.type) return false;
      if (reportFilters.category !== 'Hepsi' && t.category !== reportFilters.category) return false;
      if (q) {
        const hay = `${t.title || ''} ${t.category || ''} ${expFor} ${paidBy}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthTransactions, reportFilters, person1, person2]);

  // İstatistik Hesaplamaları (Filtrelenmiş verilere göre)
  const totalIncome = useMemo(() => {
    return filteredMonthTransactions
      .filter((t) => t.type === 'Gelir')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [filteredMonthTransactions]);

  const totalExpense = useMemo(() => {
    return filteredMonthTransactions
      .filter((t) => t.type === 'Gider')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [filteredMonthTransactions]);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0;

  // Kategori Grafiği Verisi (Filtrelenmiş verilere göre)
  const categoryData = useMemo(() => {
    return categoryLimits
      .map((cat) => {
        const val = filteredMonthTransactions
          .filter((t) => t.type === 'Gider' && t.category === cat.name)
          .reduce((acc, t) => acc + (t.amount || 0), 0);
        return { name: cat.name, value: val, color: cat.color || '#6366F1' };
      })
      .filter((c) => c.value > 0);
  }, [categoryLimits, filteredMonthTransactions]);

  // Eşler Arası Harcama Dağılımı (Filtrelenmiş verilere göre)
  const partnerData = useMemo(() => {
    return [
      {
        name: person1,
        Harcama: filteredMonthTransactions
          .filter((t) => t.type === 'Gider' && (t.expenseFor === person1 || (!t.expenseFor && t.person === person1)))
          .reduce((acc, t) => acc + (t.amount || 0), 0),
      },
      {
        name: person2,
        Harcama: filteredMonthTransactions
          .filter((t) => t.type === 'Gider' && (t.expenseFor === person2 || (!t.expenseFor && t.person === person2)))
          .reduce((acc, t) => acc + (t.amount || 0), 0),
      },
      {
        name: 'Ortak',
        Harcama: filteredMonthTransactions
          .filter((t) => t.type === 'Gider' && (t.expenseFor === 'Ortak' || (!t.expenseFor && t.person === 'Ortak')))
          .reduce((acc, t) => acc + (t.amount || 0), 0),
      },
    ];
  }, [filteredMonthTransactions, person1, person2]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      {/* Üst Navigasyon & Sekmeler */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        person1={person1}
        person2={person2}
        isFirebaseActive={isFirebaseActive}
        onOpenModal={handleOpenAddModal}
      />

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Ay / Dönem Seçici & Rapor Filtreleri (Plan, Abonelik ve Ayarlar hariç) */}
        {activeTab !== 'plan' && activeTab !== 'subscriptions' && activeTab !== 'settings' && (
          <div className="space-y-4">
            <PeriodSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
            <ReportFilterBar
              filters={reportFilters}
              onChange={setReportFilters}
              onReset={handleResetFilters}
              person1={person1}
              person2={person2}
              categories={availableCategories}
              totalCount={monthTransactions.length}
              filteredCount={filteredMonthTransactions.length}
              showTypeFilter={activeTab !== 'limits'}
            />
          </div>
        )}

        {/* Sekme 1: Özet Pano */}
        {activeTab === 'dashboard' && (
          <Dashboard
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netBalance={netBalance}
            savingsRate={savingsRate}
            categoryData={categoryData}
            partnerData={partnerData}
          />
        )}

        {/* Sekme 2: Gelir & Giderler Tablosu */}
        {activeTab === 'transactions' && (
          <TransactionsTable
            transactions={filteredMonthTransactions}
            person1={person1}
            person2={person2}
            selectedMonth={selectedMonth}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteTransaction}
            onEditIncome={handleOpenEditIncomeModal}
            onDeleteIncome={handleDeleteRecurringIncome}
            onNavigateToSubscriptions={() => setActiveTab('subscriptions')}
          />
        )}

        {/* Sekme 3: Ödeme Planı & Nakit Akışı Matrisi (Simülatör & Denge Dahil) */}
        {activeTab === 'plan' && (
          <PaymentPlanTab
            transactions={transactions}
            subscriptions={subscriptions}
            recurringIncomes={recurringIncomes}
            person1={person1}
            person2={person2}
            cardSettings={cardSettings}
            onOpenAddIncomeModal={handleOpenAddIncomeModal}
            onEditIncome={handleOpenEditIncomeModal}
            onDeleteIncome={handleDeleteRecurringIncome}
            onConvertSimulationToTransaction={handleConvertSimulationToTransaction}
          />
        )}

        {/* Sekme 4: Abonelikler */}
        {activeTab === 'subscriptions' && (
          <SubscriptionsTab
            subscriptions={subscriptions}
            person1={person1}
            person2={person2}
            onOpenAddModal={handleOpenAddSubModal}
            onEdit={handleOpenEditSubModal}
            onDelete={handleDeleteSubscription}
          />
        )}

        {/* Sekme 5: Bütçe Limitleri */}
        {activeTab === 'limits' && (
          <BudgetLimits
            categoryLimits={categoryLimits}
            transactions={filteredMonthTransactions}
          />
        )}

        {/* Sekme 6: Ayarlar */}
        {activeTab === 'settings' && (
          <SettingsTab
            person1={person1}
            person2={person2}
            categoryLimits={categoryLimits}
            cardSettings={cardSettings}
            onSave={handleSaveSettings}
            isSaving={isSavingSettings}
          />
        )}
      </main>

      {/* Yeni İşlem Ekleme / Düzenleme Modalı */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveTransaction}
        person1={person1}
        person2={person2}
        categoryLimits={categoryLimits}
        cardSettings={cardSettings}
        initialData={editingTransaction}
      />

      {/* Abonelik Ekleme / Düzenleme Modalı */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={handleCloseSubModal}
        onSubmit={handleSaveSubscription}
        person1={person1}
        person2={person2}
        categoryLimits={categoryLimits}
        initialData={editingSubscription}
      />

      {/* Düzenli Gelir Ekleme / Düzenleme Modalı */}
      <RecurringIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={handleCloseIncomeModal}
        onSubmit={handleSaveRecurringIncome}
        person1={person1}
        person2={person2}
        initialData={editingIncome}
      />

      {/* Toast Bildirimi */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
