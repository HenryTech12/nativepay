import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, Lock, FileSpreadsheet, Server, AlertCircle } from 'lucide-react';

export const TrustSafety: React.FC = () => {
  const cards = [
    {
      icon: ShieldCheck,
      title: 'Identity Verification',
      subtitle: 'Passive Face Liveness',
      bg: 'bg-white hover:bg-[#FAF5EC]',
      description:
        'Local facial feature comparison validates that the customer matches the enrolled account without requiring them to recall a 4-digit PIN. Passive liveness checks prevent static photo replay.'
    },
    {
      icon: CheckCircle2,
      title: 'Transaction Confirmation',
      subtitle: 'Dual-Channel Approval',
      bg: 'bg-white hover:bg-[#FAF5EC]',
      description:
        'Every transaction requires spoken consent in the customer’s native dialect after audio readback, coupled with the agent’s tactile confirmation. Neither party can execute unilateral transfers.'
    },
    {
      icon: Lock,
      title: 'Idempotency Keys',
      subtitle: 'Zero Double-Charges',
      bg: 'bg-white hover:bg-[#FAF5EC]',
      description:
        'Every voice command is signed with a deterministic SHA-256 idempotency key derived from the customer ID, timestamp bucket, and request payload, guaranteeing no duplicate charge on unstable rural connections.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Audit Trail & Receipts',
      subtitle: 'Immutable Ledger',
      bg: 'bg-white hover:bg-[#FAF5EC]',
      description:
        'All interactions store the audio transcript, intent classification confidence, verification timestamp, and terminal ID in an immutable audit ledger, protecting agents and elders against disputes.'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      subtitle: 'TLS 1.3 & Scoped Tokens',
      bg: 'bg-white hover:bg-[#FAF5EC]',
      description:
        'Terminals communicate via TLS 1.3 encrypted HTTPS sessions with ephemeral JWT bearer tokens. Sensitive BVN data is never stored on the edge terminal and customer balances reside in partner banks.'
    }
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>DEFENSE-IN-DEPTH ARCHITECTURE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Simple for the customer. <br />
          <span className="text-[#FF4646]">Serious underneath.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Accessible design should never mean compromised security. We implement banking-grade controls tailored to the physical realities of agent stalls.
        </p>
      </div>

      {/* Cards Grid in PayCart Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4, x: -2 }}
              className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col justify-between transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-center justify-center text-[#FF4646] mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-[#0D1B2A] font-bold uppercase tracking-wider block mb-1">
                  {c.subtitle}
                </span>
                <h3 className="text-xl font-black text-[#0D1B2A] font-display mb-3">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {c.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-[#0D1B2A]/10 flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#0D8253]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audited Specification</span>
              </div>
            </motion.div>
          );
        })}

        {/* Responsible claims banner in Pastel Yellow */}
        <div className="bg-[#FEF3C7] p-6 sm:p-7 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col justify-center text-xs text-[#0D1B2A] space-y-3">
          <div className="flex items-center gap-2 text-[#0D1B2A] font-black">
            <AlertCircle className="w-5 h-5 text-[#FF4646]" />
            <span className="text-sm font-display">Engineering Honesty Principle</span>
          </div>
          <p className="leading-relaxed font-medium">
            We reject irresponsible claims like “100% unbreakable security.” Instead, ElderPay adopts defense-in-depth: biometric matching + dual confirmation + transaction velocity ceilings + human agent dispute arbitration.
          </p>
        </div>
      </div>
    </section>
  );
};
