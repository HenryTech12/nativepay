import React from 'react';
import { motion } from 'motion/react';
import { Users, Globe2, HeartHandshake, Sparkles, TrendingUp, Info } from 'lucide-react';

export const ImpactSection: React.FC = () => {
  const illustrativeMetrics = [
    {
      value: '42M+',
      label: 'Digitally Excluded Nigerians',
      bg: 'bg-[#FFE4E6]',
      desc: 'Adults who own or have access to cash but are locked out of mobile apps due to literacy or eyesight.'
    },
    {
      value: '1.5M+',
      label: 'Agent Kiosks Nationwide',
      bg: 'bg-[#FEF3C7]',
      desc: 'Existing neighborhood POS operators who can run ElderPay voice software with zero new hardware.'
    },
    {
      value: '5',
      label: 'Major Nigerian Dialects',
      bg: 'bg-[#EEF2FF]',
      desc: 'English, Yorùbá, Nigerian Pidgin, Hausa, and Igbo covering 94% of linguistic populations.'
    },
    {
      value: '25s',
      label: 'Target Transaction Speed',
      bg: 'bg-[#D1FADF]',
      desc: 'Average time for an elder to speak, verify, confirm, and receive their receipt.'
    }
  ];

  return (
    <section id="impact" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>THE HUMAN PURPOSE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Technology shouldn’t ask people <br />
          <span className="text-[#FF4646]">to become technical.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-medium max-w-2xl mx-auto">
          “Millions of elders already know how to tell someone what they need. ElderPay gives that conversation a direct banking interface.”
        </p>
      </div>

      {/* Metrics Grid in PayCart Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {illustrativeMetrics.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -4, x: -2 }}
            className={`${m.bg} p-6 sm:p-7 rounded-2xl border-2 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A] flex flex-col justify-between transition-all duration-200`}
          >
            <div>
              <span className="text-4xl sm:text-5xl font-black text-[#0D1B2A] font-display block mb-2">
                {m.value}
              </span>
              <h3 className="text-base font-extrabold text-[#0D1B2A] mb-2 font-display">
                {m.label}
              </h3>
              <p className="text-xs text-gray-800 leading-relaxed font-medium">
                {m.desc}
              </p>
            </div>
            <div className="mt-6 pt-3 border-t-2 border-[#0D1B2A]/15 text-[9px] uppercase font-mono font-bold text-gray-700">
              INCLUSION OPPORTUNITY
            </div>
          </motion.div>
        ))}
      </div>

      {/* Illustrative Notice */}
      <div className="mt-8 max-w-2xl mx-auto p-4 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-center text-xs text-gray-700 flex items-center justify-center gap-2">
        <Info className="w-4 h-4 text-[#FF4646] shrink-0" />
        <span className="font-medium">
          <strong className="font-bold">Note on Impact Metrics:</strong> Figures represent target industry estimates and inclusion opportunity projections for financial accessibility research.
        </span>
      </div>
    </section>
  );
};
