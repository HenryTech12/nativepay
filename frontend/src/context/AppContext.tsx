import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CustomerAccount,
  Language,
  LanguageCode,
  Transaction,
  AppViewMode,
  BackendHealth,
} from '../types';
import { api } from '../services/api';

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    greeting: 'Good day',
    tagline: 'Banking that speaks to you.',
    speechCode: 'en-NG',
  },
  {
    code: 'pcm',
    label: 'Nigerian Pidgin',
    nativeLabel: 'Naija Pidgin',
    greeting: 'How far',
    tagline: 'Bank wey dey follow you talk.',
    speechCode: 'en-NG',
  },
  {
    code: 'yo',
    label: 'Yorùbá',
    nativeLabel: 'Èdè Yorùbá',
    greeting: 'Ẹ n lẹ́ o',
    tagline: 'Ìfowópamọ́ tó ń bá ọ sọ̀rọ̀.',
    speechCode: 'yo-NG',
  },
  {
    code: 'ha',
    label: 'Hausa',
    nativeLabel: 'Harshen Hausa',
    greeting: 'Sannu da zuwa',
    tagline: 'Bankin da ke magana da ku.',
    speechCode: 'ha-NG',
  },
  {
    code: 'ig',
    label: 'Igbo',
    nativeLabel: 'Asụsụ Igbo',
    greeting: 'Nnọọ',
    tagline: 'Ụlọ akụ na-agwa gị okwu.',
    speechCode: 'ig-NG',
  },
];

const DEFAULT_DEMO_ACCOUNT: CustomerAccount = {
  id: 'mama-aisha',
  name: 'Olawale Zainab',
  preferredLanguage: 'yo',
  balance: 300000,
  cardNumber: '5060 0000 0000 0001',
  address: '32 Broad Street, Lagos Island, Lagos',
  email: 'zainab.olawale@example.com',
};

const INITIAL_DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_init_1',
    userId: 'mama-aisha',
    action: 'transfer',
    amount: 5000,
    recipient: 'Ada Okafor',
    status: 'successful',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reference: 'NP-883921',
    narration: 'Family support',
  },
  {
    id: 'tx_init_2',
    userId: 'mama-aisha',
    action: 'deposit',
    amount: 25000,
    recipient: 'POS Agent Deposit',
    status: 'successful',
    createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    reference: 'NP-749102',
    narration: 'Cash in at Agency Kiosk',
  },
  {
    id: 'tx_init_3',
    userId: 'mama-aisha',
    action: 'airtime',
    amount: 1000,
    recipient: '0803 123 4567',
    status: 'successful',
    createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    reference: 'NP-439201',
    narration: 'MTN Airtime VTU',
  },
];

interface AppContextValue {
  currentCustomer: CustomerAccount;
  setCurrentCustomer: (acc: CustomerAccount) => void;
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  refreshTransactions: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  sessionToken: string | null;
  setSessionToken: (token: string | null) => void;
  backendHealth: BackendHealth | null;
  isVoiceModalOpen: boolean;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  bannerMessage: { type: 'info' | 'success' | 'warning' | 'error'; message: string } | null;
  showBanner: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearBanner: () => void;
  switchCustomerAccount: (accountId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentCustomer, setCurrentCustomerState] = useState<CustomerAccount>(() => {
    const saved = localStorage.getItem('nativepay_customer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_DEMO_ACCOUNT;
  });

  const [selectedLanguage, setSelectedLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('nativepay_lang');
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === savedLang) ||
      SUPPORTED_LANGUAGES.find((l) => l.code === currentCustomer.preferredLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  });

  const [viewMode, setViewModeState] = useState<AppViewMode>('landing');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('nativepay_txs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_DEMO_TRANSACTIONS;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const showBanner = useCallback(
    (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      setBannerMessage({ type, message });
      setTimeout(() => {
        setBannerMessage((prev) => (prev?.message === message ? null : prev));
      }, 5000);
    },
    []
  );

  const clearBanner = useCallback(() => setBannerMessage(null), []);

  const setCurrentCustomer = useCallback((acc: CustomerAccount) => {
    setCurrentCustomerState(acc);
    localStorage.setItem('nativepay_customer', JSON.stringify(acc));
  }, []);

  const setSelectedLanguage = useCallback((lang: Language) => {
    setSelectedLanguageState(lang);
    localStorage.setItem('nativepay_lang', lang.code);
  }, []);

  const setViewMode = useCallback((mode: AppViewMode) => {
    setViewModeState(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openVoiceModal = useCallback(() => setIsVoiceModalOpen(true), []);
  const closeVoiceModal = useCallback(() => setIsVoiceModalOpen(false), []);

  const addTransaction = useCallback((newTx: Transaction) => {
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      localStorage.setItem('nativepay_txs', JSON.stringify(updated));
      return updated;
    });

    // Update customer balance locally
    setCurrentCustomerState((prev) => {
      let newBalance = prev.balance;
      if (newTx.status === 'successful') {
        if (newTx.action === 'deposit') {
          newBalance += newTx.amount;
        } else {
          newBalance = Math.max(0, newBalance - newTx.amount);
        }
      }
      const updatedAcc = { ...prev, balance: newBalance };
      localStorage.setItem('nativepay_customer', JSON.stringify(updatedAcc));
      return updatedAcc;
    });
  }, []);

  // Fetch initial health & check backend connectivity
  useEffect(() => {
    let isMounted = true;
    api.getHealth().then((res) => {
      if (!isMounted) return;
      if (res.ok && res.data) {
        setBackendHealth(res.data);
      } else {
        // Fallback default demo state
        setBackendHealth({
          ok: true,
          demoMode: true,
          environment: 'sandbox',
        });
      }
    });

    // Attempt to refresh customer data from backend
    if (currentCustomer.id) {
      api.getAccount(currentCustomer.id).then((res) => {
        if (isMounted && res.ok && res.data) {
          setCurrentCustomerState((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!currentCustomer.id) return;
    const res = await api.getAccountBalance(currentCustomer.id);
    if (res.ok && res.data) {
      setCurrentCustomerState((prev) => {
        const updated = { ...prev, balance: res.data!.balance };
        localStorage.setItem('nativepay_customer', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentCustomer.id]);

  const refreshTransactions = useCallback(async () => {
    const res = await api.getTransactions(currentCustomer.id, sessionToken || undefined);
    if (res.ok && res.data && Array.isArray(res.data) && res.data.length > 0) {
      setTransactions(res.data);
      localStorage.setItem('nativepay_txs', JSON.stringify(res.data));
    }
  }, [currentCustomer.id, sessionToken]);

  const switchCustomerAccount = useCallback(async (accountId: string): Promise<boolean> => {
    const res = await api.getAccount(accountId);
    if (res.ok && res.data) {
      setCurrentCustomer(res.data);
      if (res.data.preferredLanguage) {
        const lang = SUPPORTED_LANGUAGES.find((l) => l.code === res.data!.preferredLanguage);
        if (lang) setSelectedLanguage(lang);
      }
      return true;
    }
    return false;
  }, [setCurrentCustomer, setSelectedLanguage]);

  return (
    <AppContext.Provider
      value={{
        currentCustomer,
        setCurrentCustomer,
        selectedLanguage,
        setSelectedLanguage,
        viewMode,
        setViewMode,
        transactions,
        addTransaction,
        refreshTransactions,
        refreshBalance,
        sessionToken,
        setSessionToken,
        backendHealth,
        isVoiceModalOpen,
        openVoiceModal,
        closeVoiceModal,
        bannerMessage,
        showBanner,
        clearBanner,
        switchCustomerAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
