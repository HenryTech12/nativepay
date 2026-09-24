import React from 'react';
import { motion } from 'motion/react';
import { Mic, BrainCircuit, ScanFace, CheckCircle2, Zap } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Speak',
      subtitle: 'Natural Voice Input',
      desc: 'The customer visits their neighborhood agent and speaks naturally into the ElderPay terminal in Yorùbá, Hausa, Igbo, Pidgin, or English.',
      icon: Mic,
      bg: 'bg-[#EEF2FF]',
      tech: 'Acoustic noise suppression'
    },
    {
      num: '02',
      title: 'Understand',
      subtitle: 'Entity Extraction',
      desc: 'Our NLU model parses speech audio, extracting financial intent (Transfer, Cash-out, Balance), numeral amounts, and beneficiary details.',
      icon: BrainCircuit,
      bg: 'bg-[#FEF3C7]',
      tech: 'FastAPI + Dialect Numeral Parser'
    },
    {
      num: '03',
      title: 'Verify',
      subtitle: 'Face Liveness Match',
      desc: 'The terminal camera verifies the customer’s face against their enrolled biometric vector. No passwords or secret pins required.',
      icon: ScanFace,
      bg: 'bg-[#FFE4E6]',
      tech: 'Passive liveness detection'
    },
    {
      num: '04',
      title: 'Confirm',
      subtitle: 'Native Voice Readback',
      desc: 'ElderPay synthesizes a clear audio confirmation in the customer’s language. “You are sending ₦10,000 to Adewale. Is that correct?”',
      icon: CheckCircle2,
      bg: 'bg-[#D1FADF]',
      tech: 'Mother-tongue TTS synthesis'
    },
    {
      num: '05',
      title: 'Execute',
      subtitle: 'Instant Settlement',
      desc: 'Upon verbal or tactile consent, funds move through the payment rails with instant confirmation, digital ledger receipt, and SMS dispatch.',
      icon: Zap,
      bg: 'bg-[#E0F2FE]',
      tech: 'Idempotent state machine'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>SEAMLESS WORKFLOW</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          From voice to value <br />
          <span className="text-[#FF4646]">in under 30 seconds.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Five simple steps turn spoken words into verified, audit-logged transactions without smartphone friction.
        </p>
      </div>

      {/* Grid of Steps in PayCart Neo-Brutalist Aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4, x: -2 }}
              className={`${item.bg} rounded-2xl p-5 sm:p-6 border-2 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A] flex flex-col justify-between transition-all duration-200`}
            >
              <div>
                {/* Step Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-black text-white bg-[#0D1B2A] px-2.5 py-1 rounded-full shadow-[1px_1px_0px_#FF4646]">
                    {item.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-center justify-center text-[#0D1B2A]">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-[#0D1B2A] font-display">
                  {item.title}
                </h3>
                <p className="text-xs font-bold text-[#FF4646] mb-2 uppercase tracking-wide">
                  {item.subtitle}
                </p>
                <p className="text-xs text-gray-800 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t-2 border-[#0D1B2A]/15">
                <span className="text-[9px] font-mono text-gray-600 uppercase font-bold tracking-wider block">
                  ENGINE SPEC
                </span>
                <p className="text-[10px] text-[#0D1B2A] font-mono font-bold mt-0.5 truncate">
                  {item.tech}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
