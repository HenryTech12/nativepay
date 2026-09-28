import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft, Wallet, Banknote, CheckCircle, Sparkles } from 'lucide-react';
import { TransactionType } from '../types';
import { playChime } from '../lib/audio';

interface TransactionTypesProps {
  onSelectType?: (type: TransactionType) => void;
}

export const TransactionTypes: React.FC<TransactionTypesProps> = ({ onSelectType }) => {
  const [activeType, setActiveType] = useState<TransactionType>('transfer');

  const types = [
    {
      id: 'transfer' as TransactionType,
      title: 'Send Money (Transfer)',
      tagline: 'Interbank or P2P Voice Transfers',
      icon: ArrowUpRight,
      bg: 'bg-[#D1FADF]',
      sampleYo: '“Mo fẹ́ fi ẹgbàárùn-ún náírà ránṣẹ́ sí Adéwálé”',
      sampleHa: '“Ina son tura naira dubu biyar zuwa ga Musa”',
      samplePcm: '“Send ten thousand naira give my brother”',
      fee: '₦0 - ₦25 capped',
      settlement: 'Instant (< 3s NIP credit)'
    },
    {
      id: 'cash_out' as TransactionType,
      title: 'Cash Out (Withdrawal)',
      tagline: 'Cardless Agent Cash Dispense',
      icon: Banknote,
      bg: 'bg-[#FEF3C7]',
      sampleYo: '“Mo fẹ́ gba ẹgbàárùn-ún náírà lówó yín”',
      sampleHa: '“Ina son cire naira dubu biyar tsabar kudi”',
      samplePcm: '“I wan draw five thousand naira cash”',
      fee: 'Standard agent fee',
      settlement: 'Hand-to-hand physical cash'
    },
    {
      id: 'cash_in' as TransactionType,
      title: 'Cash In (Deposit)',
      tagline: 'Physical Cash into Account',
      icon: ArrowDownLeft,
      bg: 'bg-[#EEF2FF]',
      sampleYo: '“Fún mi ní owó pamọ́ ogún ẹgbẹ̀rún náírà”',
      sampleHa: '“Ajiye min naira dubu ashirin a asusu na”',
      samplePcm: '“Deposit twenty thousand naira inside my account”',
      fee: 'Zero deposit fee',
      settlement: 'Instant balance crediting'
    },
    {
      id: 'balance' as TransactionType,
      title: 'Balance Check',
      tagline: 'Spoken Account Balance Inquiry',
      icon: Wallet,
      bg: 'bg-[#FFE4E6]',
      sampleYo: '“Èlò ló kù sínú àpò mi?”',
      sampleHa: '“Duba min kudin da ke asusun na”',
      samplePcm: '“How much remain for my account?”',
      fee: '100% Free',
      settlement: 'Spoken audio readback + print receipt'
    }
  ];

  const selectedData = types.find(t => t.id === activeType) || types[0];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>VERSATILE BANKING SUITE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Every transaction type, <br />
          <span className="text-[#FF4646]">powered by natural voice.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Whether sending money to grandchildren, withdrawing market earnings, or checking savings, ElderPay handles the full suite.
        </p>
      </div>

      {/* 4 Interactive Cards in PayCart Neo-Brutalist Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {types.map((t) => {
          const Icon = t.icon;
          const isSelected = activeType === t.id;
          return (
            <motion.div
              key={t.id}
              whileHover={{ y: -4, x: -2 }}
              onClick={() => {
                playChime('click');
                setActiveType(t.id);
                if (onSelectType) onSelectType(t.id);
              }}
              className={`p-6 rounded-2xl border-2 border-[#0D1B2A] transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${t.bg} shadow-[6px_6px_0px_#0D1B2A] -translate-y-1`
                  : 'bg-white shadow-[3px_3px_0px_#0D1B2A] hover:shadow-[5px_5px_0px_#0D1B2A]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-[#0D1B2A] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-black bg-[#0D1B2A] text-white px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#FF4646]">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-[#0D1B2A] font-display mb-1">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-700 font-medium mb-4">
                  {t.tagline}
                </p>
              </div>

              <div className="pt-3 border-t-2 border-[#0D1B2A]/15 text-xs space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-600">Settlement</span>
                  <span className="font-bold text-[#0D1B2A]">{t.settlement}</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-gray-600">Tariff</span>
                  <span className="font-bold text-[#0D8253]">{t.fee}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Preview for Selected Type */}
      <motion.div
        key={activeType}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] max-w-4xl mx-auto"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#0D1B2A]/10">
          <div>
            <h4 className="text-lg font-black text-[#0D1B2A] font-display">
              Voice Phrase Triggers for: <span className="text-[#FF4646]">{selectedData.title}</span>
            </h4>
            <p className="text-xs text-gray-700 font-medium">
              Customers say these naturally without learning complex banking keywords.
            </p>
          </div>
          <span className="text-xs bg-[#FAF5EC] text-[#0D1B2A] border-2 border-[#0D1B2A] font-mono font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_#0D1B2A]">
            INTENT: {activeType.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs">
          <div className="bg-[#FAF5EC] p-4 rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
            <span className="text-[10px] font-mono font-bold text-[#FF4646] uppercase block mb-1">
              Yorùbá Trigger
            </span>
            <p className="font-serif italic text-[#0D1B2A] font-medium">
              {selectedData.sampleYo}
            </p>
          </div>

          <div className="bg-[#FAF5EC] p-4 rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
            <span className="text-[10px] font-mono font-bold text-[#FF4646] uppercase block mb-1">
              Hausa Trigger
            </span>
            <p className="font-serif italic text-[#0D1B2A] font-medium">
              {selectedData.sampleHa}
            </p>
          </div>

          <div className="bg-[#FAF5EC] p-4 rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
            <span className="text-[10px] font-mono font-bold text-[#FF4646] uppercase block mb-1">
              Pidgin Trigger
            </span>
            <p className="font-serif italic text-[#0D1B2A] font-medium">
              {selectedData.samplePcm}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
