/**
 * İşlemleri Excel uyumlu (UTF-8 BOM içeren) CSV formatında dışa aktarır.
 * @param {Array} transactions - Dışa aktarılacak işlem listesi
 * @param {string} filename - İndirilecek dosya adı
 */
export function exportToCsv(transactions, filename = 'ev-butcesi.csv') {
  if (!transactions || transactions.length === 0) return;

  const headers = ['Tarih', 'Açıklama', 'Tür', 'Ödeme Yöntemi', 'Kategori', 'Kişi', 'Tutar (₺)'];

  const rows = transactions.map((t) => {
    const formattedAmount = Number(t.amount || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    let paymentInfo = t.paymentMethod || 'Nakit';
    if (t.isInstallment) {
      paymentInfo += ` (${t.installmentIndex}/${t.installmentTotal} Taksit)`;
    } else if (t.isSubscription) {
      paymentInfo += ' (Abonelik)';
    }

    return [
      t.date || '',
      t.title || '',
      t.type || '',
      paymentInfo,
      t.category || '',
      t.person || '',
      formattedAmount
    ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
  });

  // UTF-8 BOM (\uFEFF) ekleyerek Excel'in Türkçe karakterleri (ğ, ü, ş, ı, ö, ç) doğru algılamasını sağlıyoruz
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
