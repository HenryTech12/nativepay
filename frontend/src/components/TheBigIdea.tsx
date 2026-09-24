import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, XCircle, Mic, Sparkles, Volume2, ShieldCheck } from 'lucide-react';

export const TheBigIdea: React.FC = () => {
  const traditionalSteps = [
    { step: '01', text: 'Unlock phone & remember banking app passcode' },
    { step: '02', text: 'Find transfer option hidden inside cluttered dashboard' },
    { step: '03', text: 'Type 10-digit NUBAN account number without typos' },
    { step: '04', text: 'Select recipient destination bank from 30+ list' },
    { step: '05', text: 'Type amount in Naira, squinting at zeros' },
    { step: '06', text: 'Wait for OTP SMS, switch apps to read code' },
    { step: '07', text: 'Enter 4-digit secret transfer PIN' }
  ];

  const elderPaySteps = [
    {
      step: '01',
      title: 'Customer speaks',
      desc: 'Speak naturally in Yorùbá, Hausa, Igbo, or Pidgin at the local agent stall.',
      icon: Mic
    },
    {
      step: '02',
      title: 'ElderPay understands',
      desc: 'Multilingual NLU model extracts intent, amount, and recipient in milliseconds.',
      icon: Sparkles
    },
    {
      step: '03',
      title: 'Face verified',
      desc: 'Instant face biometric validation without memorizing 4-digit PINs.',
      icon: ShieldCheck
    },
    {
      step: '04',
      title: 'Voice readback',
      desc: 'Audio readback in their mother tongue gives 100% peace of mind.',
      icon: Volume2
    },
    {
      step: '05',
      title: 'Transaction complete',
      desc: 'Instant settlement with audio confirmation and printed receipt.',
      icon: CheckCircle
    }
  ];

  return (
    <section id="the-big-idea" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>THE PARADIGM SHIFT</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          What if banking felt like <br />
          <span className="text-[#FF4646]">talking to someone you trust?</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          We replaced 7 complex smartphone hurdles with a respectful 10-second human conversation.
        </p>
      </div>

      {/* Side-by-side comparison in PayCart Neo-Brutalist Aesthetic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Traditional Banking (Cluttered, Multi-step Barrier) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/10">
              <div className="flex items-center gap-2 text-[#E03535]">
                <XCircle className="w-5 h-5" />
                <span className="font-extrabold text-base tracking-tight font-display text-[#0D1B2A]">
                  Traditional App Banking
                </span>
              </div>
              <span className="text-xs bg-[#FFE4E6] text-[#E03535] px-3 py-1 rounded-full font-bold border border-[#E03535]/30">
                7 Stressful Steps
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-3 mb-6 font-medium">
              Assumes high smartphone literacy, 20/20 eyesight, English fluency, and PIN memorization.
            </p>

            <div className="space-y-2.5">
              {traditionalSteps.map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600"
                >
                  <span className="font-mono text-[11px] font-bold text-gray-400 shrink-0">
                    {item.step}
                  </span>
                  <span className="font-medium line-through text-gray-400 decoration-[#FF4646]">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-[#FFE4E6] border-2 border-[#0D1B2A] text-center">
            <span className="text-xs font-black text-[#E03535]">
              High Abandonment Rate among Nigerian Elders
            </span>
          </div>
        </motion.div>

        {/* Center arrow / divider */}
        <div className="lg:col-span-2 hidden lg:flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF4646] text-white flex items-center justify-center border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] transition-transform hover:scale-110">
            <ArrowRight className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono font-bold text-[#0D1B2A] mt-3 uppercase tracking-wider">
            Replaced by Voice
          </span>
        </div>

        {/* Right: ElderPay Conversational Flow (PayCart Mint & Coral) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 bg-[#D1FADF] rounded-2xl p-6 sm:p-8 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#0D1B2A]/15">
              <div className="flex items-center gap-2 text-[#0D1B2A]">
                <CheckCircle className="w-5 h-5 text-[#0D8253]" />
                <span className="font-extrabold text-base tracking-tight font-display text-[#0D1B2A]">
                  ElderPay Voice Flow
                </span>
              </div>
              <span className="text-xs bg-[#0D1B2A] text-white px-3 py-1 rounded-full font-bold shadow-[2px_2px_0px_#FF4646]">
                1 Conversation
              </span>
            </div>

            <p className="text-xs text-gray-800 mt-3 mb-6 font-medium">
              Customer speaks in their native mother tongue. AI validates intent and logs an audited ledger transaction.
            </p>

            <div className="space-y-3">
              {elderPaySteps.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#FF4646] text-white flex items-center justify-center shrink-0 text-xs font-black shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#0D1B2A] flex items-center gap-1.5">
                        <span>{item.title}</span>
                      </h4>
                      <p className="text-[11px] text-gray-700 mt-0.5 leading-snug font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-xl bg-[#0D1B2A] text-white text-center border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#FF4646]">
            <span className="text-xs font-black tracking-wide">
              ✓ Zero PIN Recall Needed · 100% Native Dialect
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
