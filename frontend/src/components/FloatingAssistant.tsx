import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Mic, Volume2, X, Sparkles, ArrowRight } from 'lucide-react';
import { playChime, speakConfirmation } from '../lib/audio';

interface FloatingAssistantProps {
  onLaunchDemo: () => void;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ onLaunchDemo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const samplePhrases = [
    { lang: 'Yorùbá', text: 'Mo fẹ́ fi ẹgbàárùn-ún náírà ránṣẹ́ sí Adéwálé' },
    { lang: 'Hausa', text: 'Ina son tura naira dubu biyar ga Aminu' },
    { lang: 'Igbo', text: 'Achọrọ m izipu puku naira iri nye Ngozi' },
    { lang: 'Pidgin', text: 'I wan send five thousand naira give my mama' }
  ];

  const handleSpeak = (text: string) => {
    playChime('click');
    setSpeaking(true);
    speakConfirmation(text, () => {
      setSpeaking(false);
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mb-3 w-80 bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] rounded-2xl p-4 text-[#0D1B2A]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-[#0D1B2A]/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FF4646] flex items-center justify-center text-white text-xs font-bold">
                  EP
                </div>
                <div>
                  <h4 className="font-extrabold text-sm font-display">Ask ElderPay</h4>
                  <p className="text-[10px] text-gray-600 font-mono">Interactive Voice Helper</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-black rounded-lg hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prompt List */}
            <div className="py-3 space-y-2">
              <p className="text-xs font-bold text-gray-700">
                Tap to hear indigenous banking prompts:
              </p>
              {samplePhrases.map((phrase) => (
                <button
                  key={phrase.lang}
                  onClick={() => handleSpeak(phrase.text)}
                  className="w-full text-left p-2.5 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#0D1B2A] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4646] block font-mono">
                      {phrase.lang}
                    </span>
                    <span className="text-xs font-medium text-[#0D1B2A] line-clamp-2">
                      “{phrase.text}”
                    </span>
                  </div>
                  <Volume2 className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
                </button>
              ))}
            </div>

            {/* Launch Demo CTA */}
            <div className="pt-2 border-t-2 border-[#0D1B2A]/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLaunchDemo();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FF4646] text-white font-bold text-xs border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Virtual POS Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Pill (PayCart Style) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            playChime('click');
            setIsOpen(!isOpen);
          }}
          className="bg-[#0D1B2A] hover:bg-[#152538] text-white px-4 py-2.5 rounded-full border-2 border-white/20 shadow-[4px_4px_0px_#FF4646] flex items-center gap-2.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>Need help? Speak with ElderPay</span>
        </button>

        <button
          onClick={() => {
            playChime('click');
            setIsOpen(!isOpen);
          }}
          className="w-12 h-12 rounded-full bg-[#0D1B2A] text-white border-2 border-white/20 shadow-[3px_3px_0px_#FF4646] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Toggle Assistant"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 text-[#FF4646]" />}
        </button>
      </div>
    </div>
  );
};
