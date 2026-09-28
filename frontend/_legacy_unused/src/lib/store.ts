import { Customer, Transaction, Agent, Language } from '../types';

export const SEEDED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Adewale Ogunleye',
    phone: '0803 452 8891',
    preferredLanguage: 'yo',
    balance: 25400,
    accountNumber: '0129482711',
    bankName: 'Wema Bank (ElderPay Virtual)',
    faceEnrolled: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    address: '14 Adeleke Street, Osogbo, Osun State',
    bvnMasked: '221***904'
  },
  {
    id: 'cust-2',
    name: 'Mama Ngozi Eze',
    phone: '0802 819 4432',
    preferredLanguage: 'ig',
    balance: 58200,
    accountNumber: '2049182390',
    bankName: 'Access Bank (ElderPay Virtual)',
    faceEnrolled: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    address: '8 New Market Road, Onitsha, Anambra State',
    bvnMasked: '222***118'
  },
  {
    id: 'cust-3',
    name: 'Alhaji Danladi Musa',
    phone: '0814 559 3012',
    preferredLanguage: 'ha',
    balance: 41800,
    accountNumber: '0039281744',
    bankName: 'Zenith Bank (ElderPay Virtual)',
    faceEnrolled: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    address: '42 Bompai Road, Fagge, Kano State',
    bvnMasked: '223***762'
  },
  {
    id: 'cust-4',
    name: 'Elder Sunday Akpan',
    phone: '0903 124 9980',
    preferredLanguage: 'pcm',
    balance: 18500,
    accountNumber: '0158291044',
    bankName: 'UBA (ElderPay Virtual)',
    faceEnrolled: false,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    address: '22 Airport Road, Warri, Delta State',
    bvnMasked: '224***409'
  }
];

export const DEFAULT_AGENT: Agent = {
  id: 'agt-101',
  name: 'Kazeem Babatunde',
  terminalId: 'EP-POS-LOS-402',
  location: 'Obalende Commercial Hub, Lagos',
  status: 'online',
  todayTransactionsCount: 38,
  todayVolumeNaira: 485000,
  successRate: 98.4
};

export const SEEDED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    reference: 'EP-2026-88192',
    type: 'transfer',
    amount: 5000,
    recipient: 'Babajide Ogunleye',
    recipientAccount: '0148291033',
    recipientBank: 'GTBank',
    sender: 'Adewale Ogunleye',
    date: '10 Sep 2026',
    time: '14:22',
    status: 'completed',
    language: 'yo',
    voiceTranscript: 'Mo fẹ́ fi ẹgbàárùn-ún náírà ránṣẹ́ sí Babajide',
    fee: 25,
    verificationMethod: 'face_verification'
  },
  {
    id: 'tx-2',
    reference: 'EP-2026-88140',
    type: 'cash_in',
    amount: 20000,
    recipient: 'Adewale Ogunleye (Self)',
    sender: 'Cash at Agent Kazeem',
    date: '08 Sep 2026',
    time: '11:05',
    status: 'completed',
    language: 'yo',
    voiceTranscript: 'Fún mi ní owó pamọ́ ogún ẹgbẹ̀rún',
    fee: 0,
    verificationMethod: 'face_verification'
  },
  {
    id: 'tx-3',
    reference: 'EP-2026-87920',
    type: 'cash_out',
    amount: 10000,
    recipient: 'Self (Agent Dispense)',
    sender: 'Adewale Ogunleye',
    date: '05 Sep 2026',
    time: '16:48',
    status: 'completed',
    language: 'yo',
    voiceTranscript: 'Mo fẹ́ gba ẹgbàárùn-ún náírà lówó yín',
    fee: 100,
    verificationMethod: 'face_verification'
  },
  {
    id: 'tx-4',
    reference: 'EP-2026-87401',
    type: 'transfer',
    amount: 7500,
    recipient: 'Iya Moria Provisions',
    recipientAccount: '2039182390',
    recipientBank: 'First Bank',
    sender: 'Adewale Ogunleye',
    date: '02 Sep 2026',
    time: '09:14',
    status: 'completed',
    language: 'yo',
    voiceTranscript: 'San ẹgbàárin náírà fún Ìyá Mọ́ríà',
    fee: 25,
    verificationMethod: 'face_verification'
  },
  {
    id: 'tx-5',
    reference: 'EP-2026-86922',
    type: 'balance',
    amount: 0,
    recipient: 'Account Balance Inquiry',
    sender: 'Adewale Ogunleye',
    date: '28 Aug 2026',
    time: '12:30',
    status: 'completed',
    language: 'yo',
    voiceTranscript: 'Èlò ló kù sínú àpò mi?',
    fee: 0,
    verificationMethod: 'face_verification'
  }
];

const STORAGE_KEYS = {
  CUSTOMERS: 'elderpay_customers_v2',
  ACTIVE_CUSTOMER_ID: 'elderpay_active_customer_id',
  TRANSACTIONS: 'elderpay_transactions_v2',
  AGENT: 'elderpay_agent'
};

export function getStoredCustomers(): Customer[] {
  if (typeof window === 'undefined') return SEEDED_CUSTOMERS;
  const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEEDED_CUSTOMERS));
    return SEEDED_CUSTOMERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEEDED_CUSTOMERS;
  }
}

export function getActiveCustomer(): Customer {
  const customers = getStoredCustomers();
  const activeId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID) : null;
  return customers.find(c => c.id === activeId) || customers[0];
}

export function setActiveCustomerId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID, id);
    window.dispatchEvent(new Event('elderpay_state_changed'));
  }
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return SEEDED_TRANSACTIONS;
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEEDED_TRANSACTIONS));
    return SEEDED_TRANSACTIONS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEEDED_TRANSACTIONS;
  }
}

export function recordTransaction(tx: Omit<Transaction, 'id' | 'reference' | 'date' | 'time' | 'status'>): Transaction {
  const customers = getStoredCustomers();
  const currentCustomer = getActiveCustomer();

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const randomRefDigits = Math.floor(10000 + Math.random() * 90000);

  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}`,
    reference: `EP-2026-${randomRefDigits}`,
    date: dateStr,
    time: timeStr,
    status: 'completed'
  };

  // Update customer balance
  let updatedBalance = currentCustomer.balance;
  if (tx.type === 'transfer' || tx.type === 'cash_out') {
    updatedBalance = Math.max(0, currentCustomer.balance - (tx.amount + tx.fee));
  } else if (tx.type === 'cash_in') {
    updatedBalance = currentCustomer.balance + tx.amount;
  }

  const updatedCustomers = customers.map(c => 
    c.id === currentCustomer.id ? { ...c, balance: updatedBalance } : c
  );

  const transactions = getStoredTransactions();
  const updatedTransactions = [newTx, ...transactions];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    window.dispatchEvent(new Event('elderpay_state_changed'));
  }

  return newTx;
}

export function resetDemoState(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEEDED_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SEEDED_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID, SEEDED_CUSTOMERS[0].id);
    window.dispatchEvent(new Event('elderpay_state_changed'));
  }
}

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}
