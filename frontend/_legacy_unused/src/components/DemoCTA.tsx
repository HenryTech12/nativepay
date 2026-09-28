import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ShieldCheck, Volume2, CheckCircle2 } from 'lucide-react';
import { playChime } from '../lib/audio';

interface DemoCTAProps {
  onLaunchDemo: () => void;
}

export const DemoCTA: React.FC<DemoCTAProps> = ({ onLaunchDemo }) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl bg-[#0D1B2A] p-8 sm:p-14 text-white text-center border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#FF4646] overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#0D1B2A] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#FF4646]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4646] animate-ping" />
            <span>INTERACTIVE EVALUATION SANDBOX</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white">
            Ready to experience <br />
            <span className="text-[#FF4646]">voice-first banking?</span>
          </h2>

          <p className="text-base sm:text-lg text-gray-300 font-medium leading-relaxed max-w-2xl mx-auto">
            Test the interactive virtual POS terminal. Choose a customer, select a Nigerian dialect, speak naturally, and watch the verified settlement complete in seconds.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                playChime('click');
                onLaunchDemo();
              }}
              className="retro-btn-primary px-9 py-4 text-base sm:text-lg font-black flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>Launch Live Simulator</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 font-mono font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Seeded Adewale Profile
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#FF4646]" /> 5 Nigerian Dialects Ready
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Passive Face Liveness
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
