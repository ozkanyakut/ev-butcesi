import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Target } from 'lucide-react';
import StatCard from './StatCard';
import CategoryPieChart from './CategoryPieChart';
import PartnerBarChart from './PartnerBarChart';

export default function Dashboard({
  totalIncome,
  totalExpense,
  netBalance,
  savingsRate,
  categoryData,
  partnerData
}) {
  return (
    <div className="space-y-6">
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOPLAM GELİR"
          value={`₺${totalIncome.toLocaleString('tr-TR')}`}
          icon={ArrowUpRight}
          badgeBg="bg-emerald-50"
          badgeText="text-emerald-600"
        />
        <StatCard
          label="TOPLAM GİDER"
          value={`₺${totalExpense.toLocaleString('tr-TR')}`}
          icon={ArrowDownRight}
          badgeBg="bg-rose-50"
          badgeText="text-rose-600"
        />
        <StatCard
          label="KALAN BÜTÇE"
          value={`₺${netBalance.toLocaleString('tr-TR')}`}
          icon={Wallet}
          badgeBg="bg-indigo-50"
          badgeText="text-indigo-600"
          valueColor={netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}
        />
        <StatCard
          label="TASARRUF ORANI"
          value={`%${savingsRate}`}
          icon={Target}
          badgeBg="bg-purple-50"
          badgeText="text-purple-600"
        />
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={categoryData} />
        <PartnerBarChart data={partnerData} />
      </div>
    </div>
  );
}
