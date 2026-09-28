import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ArrowLeft, Download, FileText, ArrowUpRight, ArrowDownLeft, 
  Banknote, Wallet, CheckCircle2, Clock, X, Printer, Share2 
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { getStoredTransactions, formatNaira } from '../lib/store';
import { playChime } from '../lib/audio';

interface HistoryPageProps {
  onNavigate: (route: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    setTransactions(getStoredTransactions());
  }, []);

  const filtered = transactions.filter(tx => {
    const matchesSearch = 
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || tx.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'transfer':
        return <ArrowUpRight className="w-4 h-4 text-[#FF4646]" />;
      case 'cash_in':
        return <ArrowDownLeft className="w-4 h-4 text-[#0D8253]" />;
      case 'cash_out':
        return <Banknote className="w-4 h-4 text-amber-600" />;
      case 'balance':
        return <Wallet className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-[#0D1B2A]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#0D1B2A]/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="retro-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#0D1B2A] font-display">
                Transaction History & Ledger
              </h1>
              <p className="text-xs text-gray-700 font-mono">
                Audited local records for all voice-executed banking transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/app')}
              className="retro-btn-primary px-4 py-2 text-xs font-black cursor-pointer"
            >
              + New Transaction
            </button>
          </div>
        </div>

        {/* Filter and Search Bar in PayCart Style */}
        <div className="bg-white p-4 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search reference, recipient, sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAF5EC] rounded-xl border-2 border-[#0D1B2A] text-xs font-medium text-[#0D1B2A] focus:outline-none"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['all', 'transfer', 'cash_in', 'cash_out', 'balance'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  playChime('click');
                  setSelectedType(t);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer whitespace-nowrap border-2 ${
                  selectedType === t
                    ? 'bg-[#FF4646] text-white border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]'
                    : 'text-[#0D1B2A] border-transparent hover:bg-[#FAF5EC]'
                }`}
              >
                {t === 'all' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table / Cards in PayCart Neo-Brutalist Style */}
        <div className="bg-white rounded-3xl border-3 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF5EC] border-b-2 border-[#0D1B2A] text-gray-700 font-mono text-[11px] font-bold">
                  <th className="p-4">TYPE</th>
                  <th className="p-4">REFERENCE</th>
                  <th className="p-4">SENDER & RECIPIENT</th>
                  <th className="p-4">AMOUNT</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">DATE & TIME</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0D1B2A]/10 font-sans">
                {filtered.length > 0 ? (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => {
                        playChime('click');
                        setSelectedTx(tx);
                      }}
                      className="hover:bg-[#FAF5EC] cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF5EC] border border-[#0D1B2A] flex items-center justify-center">
                            {getTypeIcon(tx.type)}
                          </div>
                          <span className="font-black text-[#0D1B2A] capitalize text-xs">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-[#0D1B2A]">
                        {tx.reference}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-[#0D1B2A]">{tx.recipient}</p>
                        <p className="text-[11px] text-gray-600 font-medium">From: {tx.sender}</p>
                      </td>

                      <td className="p-4 font-mono font-black text-sm text-[#FF4646]">
                        {formatNaira(tx.amount)}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FADF] text-[#0D1B2A] uppercase font-mono border border-[#0D1B2A]">
                          {tx.status}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600 text-[11px] font-mono font-medium">
                        {tx.date} · {tx.time}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="retro-btn-secondary px-3 py-1 text-xs font-bold cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-600 text-sm font-medium">
                      No transactions found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Receipt Popup */}
        <AnimatePresence>
          {selectedTx && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FAF5EC] max-w-md w-full rounded-3xl shadow-[8px_8px_0px_#0D1B2A] p-6 sm:p-8 space-y-5 border-3 border-[#0D1B2A]"
              >
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D1B2A]/10">
                  <span className="font-black text-base text-[#0D1B2A] font-display">
                    ELDER<span className="text-[#FF4646]">PAY</span> DIGITAL RECEIPT
                  </span>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="p-1 text-gray-700 hover:text-black rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] space-y-3 font-mono text-xs shadow-[3px_3px_0px_#0D1B2A]">
                  <div className="flex justify-between text-gray-700">
                    <span>Reference ID:</span>
                    <span className="font-bold text-[#0D1B2A]">{selectedTx.reference}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Transaction Type:</span>
                    <span className="font-bold text-[#0D1B2A] uppercase">{selectedTx.type}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Amount:</span>
                    <span className="font-black text-base text-[#FF4646]">{formatNaira(selectedTx.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Sender:</span>
                    <span className="font-bold text-[#0D1B2A]">{selectedTx.sender}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Recipient:</span>
                    <span className="font-bold text-[#0D1B2A]">{selectedTx.recipient}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Verification:</span>
                    <span className="text-[#0D8253] font-bold">{selectedTx.verificationMethod}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Date & Time:</span>
                    <span className="font-medium text-[#0D1B2A]">{selectedTx.date} at {selectedTx.time}</span>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0D1B2A]/10">
                    <span className="text-[10px] uppercase font-mono font-bold text-gray-600 block mb-1">
                      AUDIO COMMAND TRANSCRIPT:
                    </span>
                    <p className="p-3 bg-[#FAF5EC] rounded-xl text-[#0D1B2A] font-serif italic text-xs border border-[#0D1B2A]/20">
                      “{selectedTx.voiceTranscript}”
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 retro-btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="flex-1 retro-btn-primary py-2.5 text-xs font-black cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
