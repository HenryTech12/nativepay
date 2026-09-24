import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, ArrowRight, CheckCircle2, ShieldCheck, Volume2, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import { HeroBackground } from './HeroBackground';
import { playChime } from '../lib/audio';

interface HeroProps {
  onLaunchDemo: () => void;
  onExploreHowItWorks?: () => void;
  onExplore?: () => void;
}

const LOCAL_PHRASES = [
  { text: 'láti fóònù rẹ.', lang: 'Yorùbá', meaning: 'from your phone' },
  { text: 'da muryarka.', lang: 'Hausa', meaning: 'with your voice' },
  { text: 'site n’olu gị.', lang: 'Igbo', meaning: 'through your speech' },
  { text: 'wit your own voice.', lang: 'Pidgin', meaning: 'natural talk' }
];

export const Hero: React.FC<HeroProps> = ({ onLaunchDemo, onExplore, onExploreHowItWorks }) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [heroState, setHeroState] = useState<'listening' | 'understood' | 'verified' | 'success'>('listening');

  const handleExplore = onExplore || onExploreHowItWorks || (() => {
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth' });
  });

  // Cycle localized phrase in headline
  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % LOCAL_PHRASES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Cycle terminal state
  useEffect(() => {
    const cycle = setInterval(() => {
      setHeroState(prev => {
        if (prev === 'listening') return 'understood';
        if (prev === 'understood') return 'verified';
        if (prev === 'verified') return 'success';
        return 'listening';
      });
    }, 4200);
    return () => clearInterval(cycle);
  }, []);

  const activePhrase = LOCAL_PHRASES[phraseIndex];

  return (
    <section className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-visible">
      <HeroBackground />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* Left Column: Story & Call to action in PayCart Aesthetic */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-center lg:text-left flex flex-col items-center lg:items-start">
          {/* Eyebrow Pill (PayCart Style) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono tracking-wider uppercase"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4646] animate-ping" />
            <span>VOICE-FIRST AGENT BANKING OS</span>
          </motion.div>

          {/* Headline (PayCart Style with Space Grotesk + Accented Localized Punchline) */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0D1B2A] leading-[1.08] font-display"
          >
            Run transactions <br className="hidden sm:inline" />
            with your voice <br />
            <span className="relative inline-block mt-1">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activePhrase.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="text-[#FF4646] underline decoration-[#0D1B2A] decoration-wavy decoration-2 inline-block"
                >
                  {activePhrase.text}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-800 max-w-xl font-medium leading-relaxed"
          >
            ElderPay is the Voice-First Financial OS for 40M+ elderly and low-literacy Nigerians.
            Speak in <strong className="text-[#0D1B2A] underline decoration-[#FF4646]">Yorùbá, Hausa, Igbo, or Pidgin</strong> at any neighborhood POS stall. Payments, cash-out, and transfers with zero smartphone barrier.
          </motion.p>

          {/* PayCart Style Action Buttons (Thick dark borders + Hard offset shadows) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2"
          >
            {/* Primary Coral Button */}
            <button
              onClick={() => {
                playChime('click');
                onLaunchDemo();
              }}
              className="retro-btn-primary px-8 py-4 text-lg font-extrabold flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Secondary White Button (Log in / Agent Stall style) */}
            <button
              onClick={handleExplore}
              className="retro-btn-secondary px-7 py-4 text-base sm:text-lg font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>See How It Works</span>
            </button>
          </motion.div>

          {/* Need help? Style Pill Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-gray-700"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1B2A] text-white shadow-[2px_2px_0px_#FF4646]">
              <MessageCircle className="w-3.5 h-3.5 text-[#FF4646]" />
              <span>Voice prompt: “Mo fẹ́ fi ẹgbàárùn-ún ránṣẹ́”</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>5 Nigerian Languages Live</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Illustrated Phone & POS Terminal in PayCart Style */}
        <div className="lg:col-span-5 relative mt-4 lg:mt-0">
          {/* Floating Pastel Badge 1: Top Right (Lavender) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="absolute -top-6 -right-2 sm:-right-4 z-30 bg-[#EEF2FF] border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] rounded-2xl px-3.5 py-2 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold text-[#0D1B2A] font-mono">
              Yorùbá Detected (99.4%)
            </span>
          </motion.div>

          {/* Floating Pastel Badge 2: Mid Left (Mint Green) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute top-1/2 -left-4 sm:-left-8 -translate-y-1/2 z-30 bg-[#D1FADF] border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] rounded-2xl px-3.5 py-2 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0D8253]" />
            <div>
              <p className="text-[11px] font-extrabold text-[#0D1B2A] leading-tight">Face Verified</p>
              <p className="text-[10px] text-gray-700">Mama Ngozi (Age 64)</p>
            </div>
          </motion.div>

          {/* Floating Pastel Badge 3: Bottom Right (Pastel Yellow) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-5 right-2 sm:right-6 z-30 bg-[#FEF3C7] border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] rounded-2xl px-4 py-2 flex items-center gap-2.5"
          >
            <span className="text-xs font-bold text-[#0D1B2A]">Agent Float:</span>
            <span className="font-mono text-xs font-black text-[#0D8253]">₦485,000</span>
          </motion.div>

          {/* Tilted / Illustrated Smartphone Device Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative bg-white p-5 sm:p-6 rounded-3xl border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#0D1B2A] max-w-md mx-auto"
          >
            {/* Phone Top Notch & Camera Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#0D1B2A]/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF4646]" />
                <span className="text-xs font-mono font-bold tracking-wider text-[#0D1B2A]">
                  ELDERPAY OS #402
                </span>
              </div>
              <span className="text-[10px] bg-[#0D1B2A] text-white px-2 py-0.5 rounded-full font-mono font-bold">
                OBALENDE HUB
              </span>
            </div>

            {/* Screen Viewport with Dark High-Contrast Canvas */}
            <div className="mt-3.5 bg-[#0D1B2A] rounded-2xl p-4 sm:p-5 border-2 border-[#0D1B2A] text-white min-h-[350px] flex flex-col justify-between shadow-inner">
              {/* Customer Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Customer</p>
                  <p className="text-sm font-bold text-white">Adewale Ogunleye</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Balance</p>
                  <p className="text-sm font-bold text-[#10B981] font-mono">
                    {heroState === 'success' ? '₦15,400' : '₦25,400'}
                  </p>
                </div>
              </div>

              {/* Dynamic State Center */}
              <div className="py-5 flex flex-col items-center justify-center text-center">
                {heroState === 'listening' && (
                  <div className="space-y-3.5 w-full">
                    <div className="relative mx-auto w-16 h-16 rounded-full bg-[#FF4646] flex items-center justify-center text-white shadow-[2px_2px_0px_#ffffff]">
                      <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                      <Mic className="w-8 h-8 animate-bounce" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#FF4646] font-mono">
                        Listening in Yorùbá...
                      </p>
                      <p className="text-sm text-gray-200 mt-1 italic">
                        “Mo fẹ́ fi ẹgbàárùn-ún náírà ránṣẹ́ sí Adéwálé”
                      </p>
                    </div>

                    {/* Audio wave bars */}
                    <div className="flex items-center justify-center gap-1.5 h-8">
                      {[16, 32, 20, 36, 26, 34, 18, 28, 14].map((height, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [height * 0.4, height, height * 0.4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: 'easeInOut'
                          }}
                          className="w-1.5 bg-[#FF4646] rounded-full"
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {heroState === 'understood' && (
                  <div className="space-y-3 w-full text-left bg-white/10 p-3.5 rounded-xl border border-white/15">
                    <div className="flex items-center justify-between text-xs text-emerald-400 font-bold font-mono">
                      <span>✓ INTENT EXTRACTED</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                        99.2% MATCH
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-mono">Action</span>
                        <span className="font-bold text-white">Transfer (OWO)</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase font-mono">Amount</span>
                        <span className="font-bold text-emerald-400 font-mono text-base">₦10,000</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/10">
                        <span className="text-gray-400 block text-[9px] uppercase font-mono">Beneficiary</span>
                        <span className="font-bold text-white">Adewale Ogunleye • FirstBank</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#0D1B2A] p-2 rounded-lg border border-white/10 text-xs text-gray-300">
                      <Volume2 className="w-4 h-4 text-[#FF4646] shrink-0" />
                      <p className="text-[10px] leading-tight">
                        Audio Confirmation: “Ṣe o fẹ́ fi ₦10,000 ránṣẹ́ sí Adéwálé?”
                      </p>
                    </div>
                  </div>
                )}

                {heroState === 'verified' && (
                  <div className="space-y-3 w-full">
                    <div className="relative mx-auto w-24 h-24 rounded-2xl border-2 border-dashed border-[#FF4646] bg-black/40 overflow-hidden flex items-center justify-center">
                      <motion.div
                        animate={{ y: [-48, 48] }}
                        transition={{ duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-[#FF4646] shadow-[0_0_8px_#FF4646]"
                      />
                      <div className="w-12 h-16 rounded-t-full rounded-b-2xl border-2 border-white/40" />
                      <div className="absolute top-1 left-1.5 text-[8px] font-mono text-[#FF4646] font-bold">
                        FACE LIVENESS
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">Verifying Face Vector...</p>
                      <p className="text-[11px] text-gray-400">Local offline cosine similarity: 0.984</p>
                    </div>
                  </div>
                )}

                {heroState === 'success' && (
                  <div className="space-y-2.5 w-full bg-[#10B981]/20 border border-[#10B981]/40 p-3.5 rounded-xl">
                    <div className="w-10 h-10 mx-auto rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-lg shadow-[2px_2px_0px_#0D1B2A]">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white">Transfer Completed</h4>
                      <p className="text-xs text-emerald-300 font-mono">₦10,000 sent to Adewale</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">TRX-2026-92810 • Settled</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Trigger */}
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-mono">20s Full Cycle</span>
                <button
                  onClick={() => {
                    playChime('click');
                    onLaunchDemo();
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#FF4646] hover:bg-[#E03535] text-[11px] font-extrabold text-white flex items-center gap-1.5 cursor-pointer shadow-[1px_1px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Test in Sandbox</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
