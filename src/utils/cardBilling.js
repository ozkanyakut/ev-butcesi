/**
 * Kredi kartı hesap kesim (cutoffDay) ve son ödeme (dueDay) günlerine göre
 * yapılan harcamanın ilk taksitinin (veya ekstresinin) düşeceği son ödeme tarihini
 * ve tüm taksit tarihlerini hesaplar.
 *
 * Kurallar:
 * 1. Harcama günü (day) <= cutoffDay ise harcama bu ayın ekstresine girer.
 *    Harcama günü (day) > cutoffDay ise bu ayın ekstresi kesilmiştir; sonraki ayın ekstresine girer (+1 ay).
 * 2. Eğer dueDay > cutoffDay ise son ödeme tarihi ekstrenin kesildiği aynı ayın dueDay günüdür.
 *    Eğer dueDay <= cutoffDay ise son ödeme tarihi ekstrenin kesildiği ayın ertesi ayının dueDay günüdür (+1 ay).
 */

export function getCardConfigForOwner(paidBy, person1, person2, cardSettings) {
  if (paidBy === person2) {
    return {
      cutoffDay: Number(cardSettings?.person2?.cutoffDay) || 10,
      dueDay: Number(cardSettings?.person2?.dueDay) || 20,
    };
  }
  return {
    cutoffDay: Number(cardSettings?.person1?.cutoffDay) || 24,
    dueDay: Number(cardSettings?.person1?.dueDay) || 4,
  };
}

export function calculateFirstDueDate(purchaseDateStr, cutoffDay = 24, dueDay = 4) {
  if (!purchaseDateStr) return purchaseDateStr;
  const parts = purchaseDateStr.split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return purchaseDateStr;

  const [year, month, day] = parts;
  let monthOffset = 0;

  // 1. Hangi ayın ekstresine giriyor?
  if (day > cutoffDay) {
    monthOffset += 1;
  }

  // 2. Ekstre kesildikten sonra son ödeme tarihi aynı ayda mı, ertesi ayda mı?
  if (dueDay <= cutoffDay) {
    monthOffset += 1;
  }

  const targetMonthIdx = (month - 1) + monthOffset;
  const dueYear = year + Math.floor(targetMonthIdx / 12);
  const dueMonth = (targetMonthIdx % 12) + 1;
  const maxDays = new Date(dueYear, dueMonth, 0).getDate();
  const finalDueDay = Math.min(dueDay, maxDays);

  return `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(finalDueDay).padStart(2, '0')}`;
}

export function generateInstallmentDueDates(purchaseDateStr, installmentCount, cutoffDay = 24, dueDay = 4) {
  const firstDueDateStr = calculateFirstDueDate(purchaseDateStr, cutoffDay, dueDay);
  const [firstYear, firstMonth] = firstDueDateStr.split('-').map(Number);
  const dates = [];

  for (let i = 0; i < installmentCount; i++) {
    const targetMonthIdx = (firstMonth - 1) + i;
    const targetYear = firstYear + Math.floor(targetMonthIdx / 12);
    const targetMonth = (targetMonthIdx % 12) + 1;
    const maxDays = new Date(targetYear, targetMonth, 0).getDate();
    const targetDay = Math.min(dueDay, maxDays);
    dates.push(
      `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`
    );
  }

  return dates;
}
