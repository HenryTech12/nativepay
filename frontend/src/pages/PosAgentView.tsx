import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, 
  Clock, Store, UserCheck, AlertCircle, Banknote, Search, Phone 
} from 'lucide-react';
import { DEFAULT_AGENT, getStoredCustomers, getStoredTransactions, formatNaira } from '../lib/store';
import { Customer, Transaction } from '../types';
import { playChime } from '../lib/audio';

interface PosAgentViewProps {
  onNavigate: (route: string) => void;
}

export const PosAgentView: React.FC<PosAgentViewProps> = ({ onNavigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQueueCustomer, setActiveQueueCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const custs = getStoredCustomers();
    const txs = getStoredTransactions();
    setCustomers(custs);
    setTransactions(txs);
    if (custs.length > 0) {
      setActiveQueueCustomer(custs[0]);
    }
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.accountNumber.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-[#0D1B2A]">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <h1 className="text-xl sm:text-2xl font-black text-[#0D1B2A] font-display">
                Agent Terminal Console
              </h1>
              <p className="text-xs text-gray-700 font-mono">
                {DEFAULT_AGENT.name} · {DEFAULT_AGENT.location} ({DEFAULT_AGENT.terminalId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-xs font-bold font-mono text-[#0D1B2A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              <span>AGENT ONLINE</span>
            </div>
            <button
              onClick={() => onNavigate('/app')}
              className="retro-btn-primary px-4 py-2 text-xs font-black cursor-pointer flex items-center gap-1.5"
            >
              <span>Switch to Kiosk View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Shift Summary Cards in PayCart Neo-Brutalist Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A]">
            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono block mb-1">
              TODAY'S CASH FLOW
            </span>
            <span className="text-2xl font-black text-[#FF4646] font-mono">
              {formatNaira(DEFAULT_AGENT.todayVolumeNaira)}
            </span>
            <p className="text-[11px] text-gray-600 mt-1 font-medium">38 executed sessions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A]">
            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono block mb-1">
              CUSTOMERS SERVED
            </span>
            <span className="text-2xl font-black text-[#0D1B2A] font-mono">
              38 Active
            </span>
            <p className="text-[11px] text-[#0D8253] font-bold mt-1">98.4% first-try match</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A]">
            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono block mb-1">
              AGENT FLOAT BALANCE
            </span>
            <span className="text-2xl font-black text-[#0D1B2A] font-mono">
              ₦842,500
            </span>
            <p className="text-[11px] text-gray-600 mt-1 font-medium">Sufficient for cash-out</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A]">
            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono block mb-1">
              DEVICE CONNECTION
            </span>
            <span className="text-2xl font-black text-[#0D8253] font-mono">
              4G LTE / 28ms
            </span>
            <p className="text-[11px] text-gray-600 mt-1 font-medium">NIP Switch Active</p>
          </div>
        </div>

        {/* Current Active Counter Session & Customer Lookup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Session Console */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/10">
              <div className="flex items-center gap-2.5">
                <Store className="w-5 h-5 text-[#FF4646]" />
                <h3 className="font-black text-base text-[#0D1B2A] font-display">
                  Current Stall Customer
                </h3>
              </div>
              <span className="text-xs bg-[#D1FADF] text-[#0D1B2A] font-mono font-bold px-3 py-1 rounded-full border-2 border-[#0D1B2A]">
                READY FOR VOICE ACTION
              </span>
            </div>

            {activeQueueCustomer ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A]">
                  <img
                    src={activeQueueCustomer.avatar}
                    alt={activeQueueCustomer.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#FF4646]"
                  />
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base text-[#0D1B2A] font-display">
                      {activeQueueCustomer.name}
                    </h4>
                    <p className="text-xs text-gray-700 font-mono">
                      Phone: {activeQueueCustomer.phone}
                    </p>
                    <p className="text-xs text-gray-600">
                      Virtual NUBAN: <strong className="text-[#0D1B2A] font-mono font-bold">{activeQueueCustomer.accountNumber}</strong> ({activeQueueCustomer.bankName})
                    </p>
                    <p className="text-xs font-mono font-black text-[#0D8253] pt-1">
                      Available Balance: {formatNaira(activeQueueCustomer.balance)}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons for Agent */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600 block">
                    QUICK OPERATIONAL ACTIONS (AGENT CONSOLE)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onNavigate('/app')}
                      className="p-4 rounded-2xl bg-[#FF4646] text-white border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="text-left">
                        <span className="block text-sm font-black">Start Voice Transfer</span>
                        <span className="text-[10px] text-white/80 font-medium">Customer speaks intent</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onNavigate('/app')}
                      className="p-4 rounded-2xl bg-white border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] hover:bg-[#FAF5EC] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="text-left">
                        <span className="block text-sm font-black text-[#0D1B2A]">Cash Out Dispense</span>
                        <span className="text-[10px] text-gray-600 font-medium">Dispense physical cash</span>
                      </div>
                      <Banknote className="w-4 h-4 text-[#0D1B2A]" />
                    </button>
                  </div>
                </div>

                {/* Biometric Status */}
                <div className="p-4 rounded-2xl bg-[#FEF3C7] border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-xs text-[#0D1B2A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#FF4646]" />
                    <span>
                      <strong className="font-bold">Biometric Face Profile:</strong> Enrolled & Validated
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white px-2.5 py-1 rounded-full border border-[#0D1B2A] text-[#0D1B2A] font-bold">
                    ACTIVE
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No customer selected.</p>
            )}
          </div>

          {/* Customer Queue / Directory */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D1B2A]/10">
              <h3 className="font-black text-sm text-[#0D1B2A] font-display">
                Registered Community Customers
              </h3>
              <button
                onClick={() => onNavigate('/onboarding')}
                className="text-xs text-[#FF4646] font-bold hover:underline cursor-pointer"
              >
                + Onboard New
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, phone, or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF5EC] rounded-xl border-2 border-[#0D1B2A] text-xs font-medium text-[#0D1B2A] focus:outline-none"
              />
            </div>

            {/* Customers List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto">
              {filteredCustomers.map(c => {
                const isCurrent = activeQueueCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      playChime('click');
                      setActiveQueueCustomer(c);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isCurrent
                        ? 'bg-[#FEF3C7] border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A]'
                        : 'bg-white border-[#0D1B2A]/20 hover:border-[#0D1B2A] hover:bg-[#FAF5EC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-9 h-9 rounded-xl object-cover border border-[#0D1B2A]"
                      />
                      <div>
                        <p className="font-bold text-[#0D1B2A]">{c.name}</p>
                        <p className="text-[11px] text-gray-600 font-mono">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#0D8253]">{formatNaira(c.balance)}</p>
                      <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">{c.preferredLanguage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Transactions Log */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D1B2A]/10">
            <h3 className="font-black text-sm text-[#0D1B2A] font-display">
              Terminal Shift Settlement Log
            </h3>
            <button
              onClick={() => onNavigate('/history')}
              className="text-xs text-[#FF4646] font-bold hover:underline cursor-pointer"
            >
              Full Ledger View →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-gray-500 border-b-2 border-[#0D1B2A]/10 pb-2">
                  <th className="pb-2 font-bold">REF #</th>
                  <th className="pb-2 font-bold">CUSTOMER</th>
                  <th className="pb-2 font-bold">TYPE</th>
                  <th className="pb-2 font-bold">AMOUNT</th>
                  <th className="pb-2 font-bold">STATUS</th>
                  <th className="pb-2 font-bold">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0D1B2A]/10">
                {transactions.slice(0, 5).map(t => (
                  <tr key={t.id} className="hover:bg-[#FAF5EC] transition-colors">
                    <td className="py-2.5 font-bold text-[#0D1B2A]">{t.reference}</td>
                    <td className="py-2.5 text-[#0D1B2A] font-sans font-bold">{t.sender}</td>
                    <td className="py-2.5 text-gray-700 uppercase text-[11px] font-bold">{t.type}</td>
                    <td className="py-2.5 font-bold text-[#FF4646]">{formatNaira(t.amount)}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-[#D1FADF] text-[#0D1B2A] text-[10px] font-bold border border-[#0D1B2A]">
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600 text-[11px] font-bold">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
