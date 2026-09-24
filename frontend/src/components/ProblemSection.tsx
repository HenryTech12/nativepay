import React from 'react';
import { motion } from 'motion/react';
import { FileText, Languages, Navigation, AlertTriangle } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const problems = [
    {
      icon: FileText,
      tag: 'VISUAL OVERLOAD',
      title: 'Too much to read',
      bg: 'bg-[#FFE4E6]',
      accentColor: 'text-[#E03535]',
      description:
        'Traditional banking apps present dense paragraphs, tiny 10px fonts, and confusing financial acronyms. For elderly or low-literacy Nigerians, every screen is an intimidating hurdle.',
      example: '“Enter 10-digit NUBAN, select bank routing, verify token, confirm OTP within 60s”'
    },
    {
      icon: Languages,
      tag: 'CULTURAL EXCLUSION',
      title: 'Language barrier',
      bg: 'bg-[#FEF3C7]',
      accentColor: 'text-[#B45309]',
      description:
        'Over 100 million Nigerians speak Yorùbá, Hausa, Igbo, or Pidgin as their mother tongue. Yet 98% of banking software forces English fluency, stripping people of dignity and financial autonomy.',
      example: '“Apps require English reading comprehension just to withdraw market food money.”'
    },
    {
      icon: Navigation,
      tag: 'COGNITIVE FRICTION',
      title: 'Too much to navigate',
      bg: 'bg-[#EEF2FF]',
      accentColor: 'text-[#4338CA]',
      description:
        'Sending money takes 6 to 9 distinct screen taps through menus, submenus, dropdowns, and password screens. One accidental tap cancels the transaction or risks sending money to the wrong person.',
      example: '“Complex multi-level screens where back-buttons wipe out entered beneficiary details.”'
    }
  ];

  return (
    <section className="relative bg-[#FAF5EC] py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-t-2 border-[#0D1B2A]">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
            <span>THE REALITY OF FINANCIAL EXCLUSION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-[#0D1B2A]">
            The problem isn’t access anymore. <br />
            <span className="text-[#FF4646]">It’s the interface.</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-700 font-medium leading-relaxed">
            “There’s an agent on every street corner. But the terminal software still doesn’t speak their mother tongue.”
          </p>
        </div>

        {/* Three Animated Problem Cards in PayCart Neo-Brutalist Aesthetic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-14 sm:mt-16">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <motion.div
                key={prob.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.12 }}
                whileHover={{ y: -4, x: -2 }}
                className={`${prob.bg} p-6 sm:p-7 rounded-2xl border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] flex flex-col justify-between transition-all duration-200`}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-center justify-center text-[#0D1B2A] mb-5">
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[10px] font-mono font-bold tracking-wider text-[#0D1B2A] uppercase block mb-1">
                    {prob.tag}
                  </span>

                  <h3 className="text-2xl font-black text-[#0D1B2A] font-display mb-3">
                    {prob.title}
                  </h3>

                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {prob.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-[#0D1B2A]/20">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-gray-700 block mb-1">
                    DAILY REALITY
                  </span>
                  <p className="text-xs text-[#0D1B2A] font-mono font-semibold italic">
                    {prob.example}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
