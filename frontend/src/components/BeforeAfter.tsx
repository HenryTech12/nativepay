import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Smartphone, Volume2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { playChime } from '../lib/audio';

export const BeforeAfter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>USER EXPERIENCE COMPARISON</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Before vs After <span className="text-[#FF4646]">ElderPay</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Compare the cognitive barrier of typical banking apps against conversational voice execution.
        </p>

        {/* Toggle Pills (PayCart Style) */}
        <div className="inline-flex p-1.5 bg-white rounded-full border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] mt-4">
          <button
            onClick={() => {
              playChime('click');
              setActiveTab('before');
            }}
            className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'before'
                ? 'bg-[#0D1B2A] text-white shadow-[2px_2px_0px_#FF4646]'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            Before: Standard Banking App
          </button>
          <button
            onClick={() => {
              playChime('click');
              setActiveTab('after');
            }}
            className={`px-5 sm:px-7 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'after'
                ? 'bg-[#FF4646] text-white shadow-[2px_2px_0px_#0D1B2A]'
                : 'text-gray-700 hover:text-black'
            }`}
          >
            After: ElderPay Voice
          </button>
        </div>
      </div>

      {/* Comparison Presentation */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'before' ? (
          <motion.div
            key="before"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#FFE4E6]/40 rounded-3xl p-6 sm:p-10 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/15">
              <div className="flex items-center gap-3 text-[#0D1B2A] font-black">
                <Smartphone className="w-6 h-6 text-[#FF4646]" />
                <span className="text-lg font-display">Standard Banking Mobile App</span>
              </div>
              <span className="text-xs bg-[#FF4646] text-white font-mono font-bold px-3 py-1 rounded-full border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                HIGH COGNITIVE FRICTION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 text-xs text-gray-800 font-medium">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Small 10px Typography:</strong>
                    Requires reading small fonts on low-contrast screens in bright sun glare.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Strict English Only:</strong>
                    Zero support for Yorùbá, Hausa, Igbo, or Nigerian Pidgin.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">PIN Recall & OTPs:</strong>
                    Forgetting a 4-digit PIN locks accounts; SMS OTPs frequently time out.
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-gray-800 font-medium">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Typing 10-Digit NUBAN:</strong>
                    High error rates when typing 10 numbers without speech confirmation.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Hidden Submenus:</strong>
                    Features buried across confusing tabs, drawers, and modal sheets.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <X className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Average Duration: 3+ Minutes</strong>
                    High drop-off rates, forcing elders to surrender privacy to relatives.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="after"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#D1FADF]/40 rounded-3xl p-6 sm:p-10 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/15">
              <div className="flex items-center gap-3 text-[#0D1B2A] font-black">
                <Sparkles className="w-6 h-6 text-[#0D8253]" />
                <span className="text-lg font-display">ElderPay Voice-First Operating System</span>
              </div>
              <span className="text-xs bg-[#0D8253] text-white font-mono font-bold px-3 py-1 rounded-full border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                ZERO COGNITIVE FRICTION
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 text-xs text-[#0D1B2A] font-medium">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D8253] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Speak Naturally:</strong>
                    Elder simply talks in their native tongue just like with a family member.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D8253] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Understood Instantly:</strong>
                    NLU extracts intent, recipient, and amount accurately in seconds.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D8253] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Passive Verification:</strong>
                    Face check replaces forgotten PIN codes—no numbers to memorize.
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#0D1B2A] font-medium">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D8253] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Native Voice Readback:</strong>
                    Speaks confirmation in mother tongue before money moves.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#0D8253] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Completed in 25s:</strong>
                    Agent dispenses cash or funds are sent with print receipt.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF3C7] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <Sparkles className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#0D1B2A]">Outcome: True Financial Dignity</strong>
                    Elders bank independently without exposing secrets across the counter.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
