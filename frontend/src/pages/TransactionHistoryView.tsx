import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  FileText,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionStatus } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';

export const TransactionHistoryView: React.FC = () => {
  const { transactions, setViewMode } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesSearch =
      (tx.recipient || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.narration || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);

    const matchesAction = filterAction === 'all' || tx.action === filterAction;

    return matchesSearch && matchesAction;
  });

  // Group by date bucket (Today, Yesterday, Earlier)
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (dateStr: string) => {
    const d = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  };

  const todayTxs = filteredTxs.filter((tx) => isToday(tx.createdAt));
  const yesterdayTxs = filteredTxs.filter((tx) => isYesterday(tx.createdAt));
  const earlierTxs = filteredTxs.filter((tx) => !isToday(tx.createdAt) && !isYesterday(tx.createdAt));

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Successful
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return <span className="text-xs text-slate-500 capitalize">{status}</span>;
    }
  };

  const renderTxRow = (tx: Transaction) => (
    <div
      key={tx.id}
      onClick={() => setSelectedTx(tx)}
      className="p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/90 flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
            tx.action === 'deposit'
              ? 'bg-emerald-100 text-emerald-700'
              : tx.action === 'airtime'
              ? 'bg-purple-100 text-purple-700'
              : tx.action === 'withdraw'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {tx.action === 'deposit' ? (
            <ArrowDownLeft className="w-5 h-5" />
          ) : tx.action === 'airtime' ? (
            <Smartphone className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
            <span>
              {tx.action === 'deposit'
                ? 'Deposit from Agent'
                : tx.action === 'airtime'
                ? `Airtime (${tx.recipient})`
                : tx.action === 'withdraw'
                ? 'Cash Withdrawal'
                : tx.recipient || 'Transfer'}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>
              {new Date(tx.createdAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">{tx.reference}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div
          className={`font-black text-sm sm:text-base ${
            tx.action === 'deposit' ? 'text-emerald-600' : 'text-slate-900'
          }`}
        >
          {tx.action === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
        </div>
        <div className="mt-0.5">{getStatusBadge(tx.status)}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setViewMode('customer-home')}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Recent Transactions</h1>
        <div className="w-18"></div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, reference or amount..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'transfer', label: 'Transfers' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdraw', label: 'Withdrawals' },
            { id: 'airtime', label: 'Airtime' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterAction(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold shrink-0 cursor-pointer transition-colors ${
                filterAction === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Grouped Content */}
      {filteredTxs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs my-8">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No transactions found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {searchQuery
              ? 'No transactions match your current search query.'
              : 'Your completed transactions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {todayTxs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Today
              </p>
              <div className="space-y-2.5">{todayTxs.map(renderTxRow)}</div>
            </div>
          )}

          {yesterdayTxs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Yesterday
              </p>
              <div className="space-y-2.5">{yesterdayTxs.map(renderTxRow)}</div>
            </div>
          )}

          {earlierTxs.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Earlier
              </p>
              <div className="space-y-2.5">{earlierTxs.map(renderTxRow)}</div>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTx && (
        <ReceiptModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};
