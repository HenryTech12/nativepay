import React, { useState, useEffect } from 'react';
import {
  Mic,
  ArrowLeft,
  RefreshCw,
  Wallet,
  CreditCard,
  ShieldCheck,
  Send,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoiceAssistantModal } from '../components/VoiceAssistantModal';
import { speakText } from '../services/voice';
import { getPhrases } from '../services/localizedVoice';

export const BalanceView: React.FC = () => {
  const { currentCustomer, selectedLanguage, setViewMode, refreshBalance } = useApp();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Speak balance on mount in customer preferred language (or selected UI fallback)
    const { phrases, langCode } = getPhrases(
      currentCustomer.preferredLanguage,
      selectedLanguage.code
    );
    speakText(phrases.balanceResponse(currentCustomer.balance), langCode);
  }, [currentCustomer.balance, currentCustomer.preferredLanguage, selectedLanguage.code]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-16 text-center">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setViewMode('customer-home')}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
          title="Refresh balance from backend"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Clean Balance Screen */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>

        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
          Available Balance
        </p>

        <div className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight my-2">
          ₦{currentCustomer.balance.toLocaleString()}
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/50 mt-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Active Account
        </div>

        {/* Account Details Box */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-left text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Account Holder</span>
            <span className="font-bold text-slate-800">{currentCustomer.name}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Card Number</span>
            <span className="font-mono font-semibold text-slate-700">
              {currentCustomer.cardNumber || '5060 •••• •••• 0001'}
            </span>
          </div>
        </div>
      </div>

      {/* Voice Assistant Primary Action */}
      <div className="space-y-4">
        <button
          onClick={() => setIsVoiceOpen(true)}
          className="w-full py-4.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-transform shadow-lg shadow-emerald-600/25 text-lg cursor-pointer active:scale-98"
        >
          <Mic className="w-6 h-6" />
          <span>Speak a Transaction</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('customer-history')}
            className="flex-1 py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl text-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4 text-emerald-600" />
            <span>Transaction History</span>
          </button>
          <button
            onClick={() => setViewMode('customer-home')}
            className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors cursor-pointer"
          >
            Back Home
          </button>
        </div>
      </div>

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />
    </div>
  );
};
