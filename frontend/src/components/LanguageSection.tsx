import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Languages, Sparkles, Check, Info } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGES } from '../lib/phrases';
import { playChime, speakConfirmation, stopSpeaking } from '../lib/audio';

export const LanguageSection: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<Language>('yo');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const langInfo = LANGUAGES[selectedLang];

  const handlePlayAudio = () => {
    stopSpeaking();
    playChime('listen');
    setIsPlayingAudio(true);
    speakConfirmation(langInfo.samplePhrase, () => setIsPlayingAudio(false));
  };

  return (
    <section id="languages" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>NATIVE DIALECT ENGINE</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Your language. <span className="text-[#FF4646]">Your banking.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Transactions understood in the languages millions of Nigerians speak, pray, and trade in every single day.
        </p>
      </div>

      {/* Language Selector Tabs (PayCart Style) */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-10">
        {(Object.keys(LANGUAGES) as Language[]).map((code) => {
          const item = LANGUAGES[code];
          const isSelected = selectedLang === code;
          return (
            <button
              key={code}
              onClick={() => {
                playChime('click');
                setSelectedLang(code);
                stopSpeaking();
                setIsPlayingAudio(false);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                isSelected
                  ? 'bg-[#FF4646] text-white'
                  : 'bg-white text-[#0D1B2A] hover:bg-[#FAF5EC]'
              }`}
            >
              <span>{item.name}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.nativeName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Language Showcase Card in PayCart Neo-Brutalist Aesthetic */}
      <motion.div
        key={selectedLang}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-9 border-2 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#0D1B2A]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#0D1B2A] font-display">
                {langInfo.name}
              </span>
              <span className="text-sm text-gray-600 font-mono font-bold">({langInfo.nativeName})</span>
            </div>
            <p className="text-xs text-[#FF4646] font-mono font-bold mt-1 uppercase">
              Primary region: {langInfo.region}
            </p>
          </div>

          <button
            onClick={handlePlayAudio}
            className="retro-btn-secondary px-4 py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Volume2 className={`w-4 h-4 text-[#FF4646] ${isPlayingAudio ? 'animate-bounce' : ''}`} />
            <span>{isPlayingAudio ? 'Playing Sample...' : 'Hear Spoken Sample'}</span>
          </button>
        </div>

        {/* Phrases Breakdown in Pastel Neo-Brutalist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#FEF3C7] p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0D1B2A] block mb-1">
              SPOKEN VOICE COMMAND (INPUT)
            </span>
            <p className="text-base font-serif italic text-[#0D1B2A] leading-snug font-medium">
              “{langInfo.samplePhrase}”
            </p>
            <p className="text-xs text-gray-700 mt-2 font-medium">
              Meaning: <strong className="text-[#0D1B2A]">{langInfo.sampleTranslation}</strong>
            </p>
          </div>

          <div className="bg-[#D1FADF] p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0D8253] block mb-1">
              VOICE READBACK (CONFIRMATION)
            </span>
            <p className="text-xs text-[#0D1B2A] leading-relaxed font-semibold">
              “{langInfo.confirmationText}”
            </p>
            <p className="text-[11px] text-gray-700 mt-2 font-medium">
              Reassurance in native dialect before funds leave the account.
            </p>
          </div>
        </div>

        {/* Success Confirmation state */}
        <div className="bg-[#EEF2FF] p-4 rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#0D1B2A]">
            <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
            <span>
              <strong className="font-bold">Spoken Receipt:</strong> “{langInfo.successText}”
            </span>
          </div>
        </div>

        {/* Production Validation Note */}
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FAF5EC] border-2 border-[#0D1B2A] text-xs text-[#0D1B2A]">
          <Info className="w-4 h-4 text-[#FF4646] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            <strong className="font-bold">Production Validation Note:</strong> Local-language AI translation and speech synthesis quality is best-effort in this prototype environment and should be rigorously validated with native speakers and community elder panels prior to commercial banking deployment.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
