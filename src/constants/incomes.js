export const DEFAULT_RECURRING_INCOMES = [
  {
    id: 'inc-1',
    title: 'Ek Gelir (1. Kısım)',
    amount: 25000,
    day: 1,
    person: 'Ortak',
    active: true,
    description: 'Her ayın 1. günü hesaba geçen ek gelir'
  },
  {
    id: 'inc-2',
    title: 'Maaş Kalanı',
    amount: 60000,
    day: 10,
    person: 'Özkan',
    active: true,
    description: 'Her ayın 10. günü yatan ana maaş bakiyesi'
  },
  {
    id: 'inc-3',
    title: 'Maaş Avansı',
    amount: 22500,
    day: 25,
    person: 'Özkan',
    active: true,
    description: 'Her ayın 25. günü yatan sonraki ayın maaş avansı'
  },
  {
    id: 'inc-4',
    title: 'Ek Gelir (2. Kısım)',
    amount: 25000,
    day: 27,
    person: 'Ortak',
    active: true,
    description: 'Her ayın 27. günü hesaba geçen ek gelir'
  }
];

export const DEFAULT_CARD_SETTINGS = {
  person1: {
    cutoffDay: 24,
    dueDay: 4,
    cardName: 'Özkan Kredi Kartı'
  },
  person2: {
    cutoffDay: 10,
    dueDay: 20,
    cardName: 'Ece Kredi Kartı'
  }
};
