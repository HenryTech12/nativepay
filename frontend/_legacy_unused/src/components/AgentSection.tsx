import React from 'react';
import { motion } from 'motion/react';
import { Store, Users, TrendingUp, ShieldCheck, CheckCircle2, Terminal, Clock, ArrowRight } from 'lucide-react';
import { DEFAULT_AGENT, formatNaira } from '../lib/store';
import { useCountUp } from '../lib/useCountUp';

interface AgentSectionProps {
  onOpenAgentPos?: () => void;
}

export const AgentSection: React.FC<AgentSectionProps> = ({ onOpenAgentPos }) => {
  const animatedVol = useCountUp(DEFAULT_AGENT.todayVolumeNaira, 1200);
  const animatedCount = useCountUp(DEFAULT_AGENT.todayTransactionsCount, 800);

  const agentBenefits = [
    {
      title: 'Zero New Hardware to Buy',
      desc: 'Runs on standard Android POS terminals, tablets, and smartphones already deployed at 1.5M+ Nigerian agent kiosks.'
    },
    {
      title: '3x Faster Queues',
      desc: 'Voice entry and biometric verification cut transaction time from 3 minutes of typing down to 25 seconds.'
    },
    {
      title: 'Elderly Trust & Dignity',
      desc: 'Elders no longer need to whisper their private 4-digit PINs across crowded market counters.'
    },
    {
      title: 'Higher Commission Earnings',
      desc: 'Agents serve high-frequency elderly pensions, remittances, and market trader cash flow with zero dispute chargebacks.'
    }
  ];

  return (
    <section id="for-agents" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>AGENT-ASSISTED INFRASTRUCTURE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Built for the agent network <br />
          <span className="text-[#FF4646]">already around you.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          ElderPay doesn’t try to replace the neighborhood POS agent. We equip them with an intelligent voice OS that turns every stall into an accessible community branch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Column: Benefits & Narrative in PayCart Style */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agentBenefits.map((b, idx) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[1px_1px_0px_#0D1B2A] text-[#FF4646] flex items-center justify-center font-black text-sm mb-3">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0D1B2A] font-display mb-1.5">
                    {b.title}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-5 bg-[#FAF5EC] rounded-2xl border-2 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#0D1B2A] text-white flex items-center justify-center border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#FF4646] shrink-0">
                <Store className="w-5 h-5 text-[#FF4646]" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0D1B2A]">Run the POS Terminal</h4>
                <p className="text-xs text-gray-600 font-medium">Test the dedicated agent operational console</p>
              </div>
            </div>
            {onOpenAgentPos && (
              <button
                onClick={onOpenAgentPos}
                className="retro-btn-primary py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Open /pos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Realistic Agent Dashboard Preview (PayCart Style) */}
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#0D1B2A] space-y-6"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] text-white flex items-center justify-center font-black font-display border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#FF4646]">
                  KB
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0D1B2A]">{DEFAULT_AGENT.name}</h4>
                  <p className="text-xs text-gray-600 font-mono">{DEFAULT_AGENT.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#0D1B2A] bg-[#D1FADF] px-3 py-1 rounded-full border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  TERMINAL ACTIVE
                </span>
              </div>
            </div>

            {/* Metrics Row with Pastel Neo-Brutalist Pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#D1FADF] p-3.5 rounded-2xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                <span className="text-[10px] font-mono font-bold text-[#0D1B2A] uppercase tracking-wider block">
                  TODAY'S VOL
                </span>
                <span className="text-sm sm:text-base font-black text-[#0D8253] font-mono block mt-1 truncate">
                  {formatNaira(animatedVol)}
                </span>
                <span className="text-[9px] text-gray-700 font-bold">+18% growth</span>
              </div>

              <div className="bg-[#FEF3C7] p-3.5 rounded-2xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                <span className="text-[10px] font-mono font-bold text-[#0D1B2A] uppercase tracking-wider block">
                  CUSTOMERS
                </span>
                <span className="text-sm sm:text-base font-black text-[#0D1B2A] font-mono block mt-1">
                  {animatedCount} Served
                </span>
                <span className="text-[9px] text-gray-700 font-bold">22 Elders</span>
              </div>

              <div className="bg-[#EEF2FF] p-3.5 rounded-2xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                <span className="text-[10px] font-mono font-bold text-[#0D1B2A] uppercase tracking-wider block">
                  SUCCESS
                </span>
                <span className="text-sm sm:text-base font-black text-[#4338CA] font-mono block mt-1">
                  98.4%
                </span>
                <span className="text-[9px] text-gray-700 font-bold">0 Disputes</span>
              </div>
            </div>

            {/* Active Session Simulation Card */}
            <div className="bg-[#FAF5EC] rounded-2xl p-4 border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0D1B2A] uppercase tracking-wider text-[10px] font-mono">
                  CURRENT POS SESSION #402-98
                </span>
                <span className="text-[#FF4646] font-extrabold font-mono text-[11px]">
                  Voice Engine: ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#0D1B2A]/10">
                <div>
                  <span className="text-gray-500 text-[10px] block font-mono">Customer</span>
                  <span className="font-bold text-[#0D1B2A]">Adewale Ogunleye</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-mono">Language</span>
                  <span className="font-bold text-[#FF4646]">Yorùbá</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block font-mono">Liveness</span>
                  <span className="font-bold text-[#0D8253] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Passed
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Terminal Activity */}
            <div>
              <span className="text-[10px] font-mono font-bold text-gray-600 uppercase tracking-wider block mb-2">
                AUDITED SESSION LOG
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <span className="text-gray-800 font-medium">TRANSFER ₦10,000 → Adewale</span>
                  <span className="text-[#0D8253] font-bold">SUCCESS (22s)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                  <span className="text-gray-800 font-medium">CASH-OUT ₦5,000 → Mama Ngozi</span>
                  <span className="text-[#0D8253] font-bold">DISPENSED (28s)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
