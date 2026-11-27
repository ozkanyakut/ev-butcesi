import React from 'react';
import { Wallet, Plus, LayoutDashboard, ListOrdered, CalendarRange, Repeat, Target, Settings } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  person1,
  person2,
  isFirebaseActive,
  onOpenModal
}) {
  const tabs = [
    { id: 'dashboard', label: 'Özet Pano', icon: LayoutDashboard },
    { id: 'transactions', label: 'Gelir & Giderler', icon: ListOrdered },
    { id: 'plan', label: 'Ödeme Planı', icon: CalendarRange },
    { id: 'subscriptions', label: 'Abonelikler', icon: Repeat },
    { id: 'limits', label: 'Bütçe Limitleri', icon: Target },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
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
                <span 
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isFirebaseActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {isFirebaseActive ? 'Canlı Senkronize' : 'Demo Modu'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Yeni Ekle
          </button>
        </div>

        <div className="flex space-x-8 border-t border-slate-100 pt-2 text-sm font-medium overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
