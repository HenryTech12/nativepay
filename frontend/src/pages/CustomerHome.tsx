import React, { useState } from 'react';
import {
  Mic,
  Send,
  Wallet,
  ArrowDownToLine,
  Smartphone,
  Eye,
  EyeOff,
  History,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VoiceAssistantModal } from '../components/VoiceAssistantModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { Transaction } from '../types';

export const CustomerHome: React.FC = () => {
  const {
    currentCustomer,
    selectedLanguage,
    transactions,
    viewMode,
    setViewMode,
  } = useApp();

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<'transfer' | 'balance' | 'withdraw' | 'airtime' | undefined>();
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleOpenVoice = (action?: 'transfer' | 'balance' | 'withdraw' | 'airtime') => {
    setInitialAction(action);
    setIsVoiceOpen(true);
  };

  const recentTxs = transactions.slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* 1. Welcoming Hero Banner */}
      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 mb-2">
          <span>{selectedLanguage.nativeLabel}</span>
          <span>•</span>
          <span>{currentCustomer.name}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {selectedLanguage.greeting} 👋
        </h1>
        <p className="text-slate-600 text-lg sm:text-xl font-medium mt-1">
          How can I help you today?
        </p>
      </div>

      {/* 2. Account Balance Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl mb-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Available Balance</span>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label={showBalance ? 'Hide balance' : 'Show balance'}
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="relative z-10 mb-6">
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {showBalance ? `₦${currentCustomer.balance.toLocaleString()}` : '₦ ••••••••'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-700/60 text-xs text-slate-300 relative z-10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">{currentCustomer.cardNumber || '5060 •••• •••• 0001'}</span>
          </div>
          <button
            onClick={() => setViewMode('customer-balance')}
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. The Dominant Central Voice Button */}
      <div className="bg-emerald-50/80 border-2 border-emerald-200/80 rounded-3xl p-8 sm:p-10 text-center mb-8 shadow-sm">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-800 mb-2">
          Fastest Way To Transact
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Tap and Speak
        </h2>

        <div className="relative inline-flex items-center justify-center my-2">
          <span className="absolute w-36 h-36 rounded-full bg-emerald-400/20 animate-pulse pointer-events-none"></span>
          <button
            onClick={() => handleOpenVoice()}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center shadow-xl shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
            aria-label="Speak to NativePay"
          >
            <Mic className="w-12 h-12 sm:w-14 sm:h-14 mb-1" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Speak</span>
          </button>
        </div>

        <p className="text-slate-600 text-sm mt-6 max-w-sm mx-auto">
          Say «Send ₦5,000 to Ada» or «Check my balance» in {selectedLanguage.label}.
        </p>
      </div>

      {/* 4. Quick Action Buttons */}
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Or Choose An Action:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => handleOpenVoice('transfer')}
            className="p-5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-slate-800 flex flex-col items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Send className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm sm:text-base">Send Money</span>
          </button>

          <button
            onClick={() => setViewMode('customer-balance')}
            className="p-5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-slate-800 flex flex-col items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm sm:text-base">Check Balance</span>
          </button>

          <button
            onClick={() => handleOpenVoice('withdraw')}
            className="p-5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-slate-800 flex flex-col items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm sm:text-base">Withdraw</span>
          </button>

          <button
            onClick={() => handleOpenVoice('airtime')}
            className="p-5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-slate-800 flex flex-col items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm sm:text-base">Buy Airtime</span>
          </button>
        </div>
      </div>

      {/* 5. Recent Activity List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">Recent Transactions</h3>
          </div>
          <button
            onClick={() => setViewMode('customer-history')}
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No transactions yet. Your completed transactions will appear here.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      tx.action === 'deposit'
                        ? 'bg-emerald-100 text-emerald-700'
                        : tx.action === 'airtime'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tx.action === 'deposit' ? '↑' : '↓'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {tx.action === 'deposit'
                        ? 'Cash Deposit'
                        : tx.recipient || 'Transfer'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' • '}
                      <span className="text-emerald-600 font-medium">Successful</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-sm ${
                      tx.action === 'deposit' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.action === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">{tx.reference}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        initialAction={initialAction}
      />

      {/* Embedded Receipt Modal */}
      {selectedTx && (
        <ReceiptModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};
