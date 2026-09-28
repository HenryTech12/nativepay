import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, ShieldCheck, CheckCircle2, RotateCcw, ArrowRight, UserCheck, XCircle, Sparkles, RefreshCw, Printer, Check } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGES } from '../lib/phrases';
import { playChime, speakConfirmation, stopSpeaking } from '../lib/audio';
import { getActiveCustomer, recordTransaction, formatNaira } from '../lib/store';

type DemoStep = 'idle' | 'listening' | 'understood' | 'verifying' | 'success';

interface InteractiveVoiceDemoProps {
  initialLanguage?: Language;
  onViewHistory?: () => void;
}

export const InteractiveVoiceDemo: React.FC<InteractiveVoiceDemoProps> = ({
  initialLanguage = 'yo',
  onViewHistory
}) => {
  const [currentLang, setCurrentLang] = useState<Language>(initialLanguage);
  const [step, setStep] = useState<DemoStep>('idle');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [reference, setReference] = useState('EP-2026-92841');
  const [balance, setBalance] = useState(25400);
  const [isSpeakingReadback, setIsSpeakingReadback] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const langData = LANGUAGES[currentLang];
  const customer = getActiveCustomer();

  useEffect(() => {
    setBalance(customer.balance);
  }, [customer]);

  // Handler to start voice interaction
  const handleStartListening = () => {
    stopSpeaking();
    playChime('listen');
    setStep('listening');
    setAudioTranscript('');

    const fullText = langData.samplePhrase;
    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex <= fullText.length) {
        setAudioTranscript(fullText.slice(0, charIndex));
        charIndex += 2;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          playChime('understood');
          setStep('understood');
          speakConfirmation(langData.confirmationText, () => setIsSpeakingReadback(false));
          setIsSpeakingReadback(true);
        }, 600);
      }
    }, 45);
  };

  // User confirms readback
  const handleConfirmIntent = () => {
    stopSpeaking();
    playChime('verify');
    setStep('verifying');
    setScanProgress(0);

    let p = 0;
    const scanInterval = setInterval(() => {
      p += 10;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(scanInterval);
        setTimeout(() => {
          // Record transaction in ledger
          const newRef = `EP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
          setReference(newRef);
          recordTransaction({
            type: 'transfer',
            amount: 10000,
            fee: 0,
            recipient: 'Adewale Ogunleye',
            recipientAccount: '0129482711',
            recipientBank: 'Wema Bank',
            sender: customer.name,
            language: currentLang,
            voiceTranscript: langData.samplePhrase,
            verificationMethod: 'face_verification'
          });

          setBalance(prev => Math.max(0, prev - 10000));
          playChime('success');
          setStep('success');
          speakConfirmation(langData.successText);
        }, 500);
      }
    }, 180);
  };

  const handleRepeatReadback = () => {
    playChime('click');
    setIsSpeakingReadback(true);
    speakConfirmation(langData.confirmationText, () => setIsSpeakingReadback(false));
  };

  const handleCancel = () => {
    stopSpeaking();
    playChime('click');
    setStep('idle');
  };

  const handleReset = () => {
    stopSpeaking();
    playChime('click');
    setStep('idle');
    setScanProgress(0);
  };

  return (
    <section id="demo" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>INTERACTIVE CENTERPIECE DEMO</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Just say what you need. <br />
          <span className="text-[#FF4646]">No menus. Zero PIN stress.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          “Speak in your dialect. ElderPay parses, verifies with face biometrics, and executes immediately.”
        </p>

        {/* Language switcher pills in PayCart style */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {(Object.keys(LANGUAGES) as Language[]).map(l => (
            <button
              key={l}
              onClick={() => {
                playChime('click');
                setCurrentLang(l);
                if (step !== 'idle' && step !== 'listening') {
                  setStep('idle');
                  stopSpeaking();
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                currentLang === l
                  ? 'bg-[#FF4646] text-white'
                  : 'bg-white text-[#0D1B2A] hover:bg-[#FAF5EC]'
              }`}
            >
              {LANGUAGES[l].name} ({LANGUAGES[l].nativeName})
            </button>
          ))}
        </div>
      </div>

      {/* POS Terminal Centerpiece Card in PayCart Neo-Brutalist styling */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#0D1B2A] overflow-hidden">
        {/* Terminal Top Hardware Bar */}
        <div className="bg-[#0D1B2A] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#0D1B2A]">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#FF4646] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-white">
              ELDERPAY POS VIRTUAL TERMINAL #402
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono bg-white text-[#0D1B2A] font-extrabold px-2.5 py-0.5 rounded-full">
              {LANGUAGES[currentLang].name.toUpperCase()}
            </span>
            <span className="text-xs text-gray-300 font-mono font-bold">
              BAL: <strong className="text-[#10B981]">{formatNaira(balance)}</strong>
            </span>
          </div>
        </div>

        {/* Customer Context Bar */}
        <div className="bg-[#FAF5EC] px-6 py-3 border-b-2 border-[#0D1B2A]/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0D1B2A] text-white flex items-center justify-center font-black text-[10px]">
              AO
            </div>
            <span className="text-gray-700">
              Customer: <strong className="text-[#0D1B2A] font-bold">{customer.name}</strong>
            </span>
          </div>
          <span className="text-gray-600 font-mono text-[11px] font-semibold">
            Acct: {customer.accountNumber} ({customer.bankName})
          </span>
        </div>

        {/* Interactive Screen Area */}
        <div className="p-6 sm:p-10 min-h-[420px] flex flex-col justify-center items-center text-center relative bg-gradient-to-b from-white to-[#FAF5EC]">
          {/* STATE 1: IDLE */}
          {step === 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 max-w-md"
            >
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-[#FF4646]/20 animate-ping pointer-events-none" />
                <button
                  onClick={handleStartListening}
                  className="relative w-24 h-24 rounded-full bg-[#FF4646] text-white flex flex-col items-center justify-center border-3 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer group"
                >
                  <Mic className="w-9 h-9 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1 text-white">
                    Tap to Speak
                  </span>
                </button>
              </div>

              <div>
                <p className="text-sm font-extrabold text-[#0D1B2A] font-display">
                  Ready in {langData.name} ({langData.nativeName})
                </p>
                <p className="text-xs text-gray-600 mt-1 font-mono italic">
                  “{langData.samplePhrase}”
                </p>
              </div>

              <div className="p-3.5 bg-[#FEF3C7] rounded-xl border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-xs text-[#0D1B2A] font-medium text-left">
                💡 <strong className="font-bold">Simulated test prompt:</strong> Transfer ₦10,000 to Adewale. Tap the coral microphone above to begin!
              </div>
            </motion.div>
          )}

          {/* STATE 2: LISTENING */}
          {step === 'listening' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 max-w-md w-full"
            >
              <div className="relative mx-auto w-20 h-20 rounded-full bg-[#FF4646] text-white flex items-center justify-center border-3 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A]">
                <div className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping" />
                <Mic className="w-8 h-8 animate-pulse text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0D1B2A] text-white text-xs font-bold uppercase tracking-wider font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
                  <span>Listening carefully...</span>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] min-h-[60px] flex items-center justify-center">
                  <p className="text-base text-[#0D1B2A] font-serif italic">
                    “{audioTranscript || 'Listening to speech stream...'}”
                  </p>
                </div>
              </div>

              {/* Waveform visualizer */}
              <div className="flex items-center justify-center gap-1.5 h-10">
                {[14, 28, 38, 22, 44, 30, 20, 36, 18, 28, 42, 16].map((h, idx) => (
                  <motion.div
                    key={idx}
                    animate={{ height: [h * 0.3, h, h * 0.3] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: idx * 0.05,
                      ease: 'easeInOut'
                    }}
                    className="w-1.5 bg-[#FF4646] rounded-full"
                    style={{ height: h }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STATE 3: UNDERSTOOD & CONFIRMATION */}
          {step === 'understood' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 max-w-md w-full text-left"
            >
              <div className="flex items-center justify-between border-b-2 border-[#0D1B2A]/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0D1B2A]">
                    INTENT EXTRACTED: TRANSFER
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0D8253] bg-[#D1FADF] px-2.5 py-0.5 rounded-full border border-[#0D8253]/30">
                  99.4% match
                </span>
              </div>

              {/* Extracted payload card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono font-bold">Action</span>
                  <span className="font-bold text-[#0D1B2A]">Direct Bank Transfer</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono font-bold">Amount</span>
                  <span className="text-xl font-extrabold text-[#0D8253] font-mono">₦10,000</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono font-bold">Recipient</span>
                  <span className="font-bold text-[#0D1B2A]">Adewale Ogunleye</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono font-bold">Destination</span>
                  <span className="text-gray-800 font-medium">Wema Bank (0129482711)</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t-2 border-[#0D1B2A]/10">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono font-bold">Fee</span>
                  <span className="font-bold text-[#0D8253]">₦0.00 (Agent Free Promotion)</span>
                </div>
              </div>

              {/* Spoken readback notice */}
              <div className="p-3.5 bg-[#EEF2FF] rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-start gap-3">
                <Volume2 className={`w-5 h-5 text-[#4338CA] shrink-0 mt-0.5 ${isSpeakingReadback ? 'animate-bounce' : ''}`} />
                <div className="text-xs text-[#0D1B2A]">
                  <p className="font-extrabold">Audio Readback ({langData.name}):</p>
                  <p className="italic text-gray-800 mt-0.5 font-medium">
                    “{langData.confirmationText}”
                  </p>
                </div>
              </div>

              {/* Confirmation Controls: Confirm, Repeat, Cancel */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={handleCancel}
                  className="py-3 px-3 rounded-xl border-2 border-[#0D1B2A] bg-white shadow-[2px_2px_0px_#0D1B2A] text-gray-700 hover:bg-gray-100 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <XCircle className="w-3.5 h-3.5 text-gray-500" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={handleRepeatReadback}
                  className="py-3 px-3 rounded-xl border-2 border-[#0D1B2A] bg-[#FEF3C7] shadow-[2px_2px_0px_#0D1B2A] text-[#0D1B2A] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Repeat</span>
                </button>

                <button
                  onClick={handleConfirmIntent}
                  className="retro-btn-primary py-3 px-3 text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 4: FACE VERIFICATION SCANNING */}
          {step === 'verifying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 max-w-md w-full"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0D1B2A] text-white text-xs font-bold uppercase tracking-wider font-mono">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>VERIFYING FACE BIOMETRICS</span>
              </div>

              {/* Camera Frame */}
              <div className="relative mx-auto w-48 h-56 rounded-2xl border-3 border-[#0D1B2A] bg-[#0D1B2A] overflow-hidden shadow-[6px_6px_0px_#0D1B2A] flex items-center justify-center">
                {/* Viewfinder crosshairs */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#FF4646]" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#FF4646]" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#FF4646]" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#FF4646]" />

                {/* Animated scanning line */}
                <motion.div
                  animate={{ y: [-90, 90] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-[#FF4646] shadow-[0_0_12px_#FF4646]"
                />

                {/* Face outline / Customer silhouette */}
                <div className="w-24 h-32 rounded-t-full rounded-b-3xl border-2 border-dashed border-white/40 flex flex-col items-center justify-center p-2">
                  <div className="w-8 h-8 rounded-full border border-white/50 mb-1" />
                  <div className="w-14 h-12 rounded-t-xl border border-white/50" />
                </div>

                <span className="absolute bottom-2 font-mono text-[10px] text-white font-bold bg-[#FF4646] px-2.5 py-0.5 rounded-full">
                  SCANNING: {scanProgress}%
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-extrabold text-[#0D1B2A] font-display">
                  {scanProgress < 100 ? 'Matching face vector...' : 'Identity Verified ✓'}
                </p>
                <p className="text-xs text-gray-700 max-w-xs mx-auto font-medium">
                  Matching with local enrolled template. Passive liveness passed.
                </p>
              </div>
            </motion.div>
          )}

          {/* STATE 5: SUCCESS RECEIPT */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 max-w-md w-full text-left"
            >
              {/* Receipt Header Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-black text-sm border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-black text-base text-[#0D1B2A] font-display leading-tight">
                      Transaction Dispatched
                    </h3>
                    <p className="text-[11px] text-[#0D8253] font-bold">
                      Settled on Interbank Switch
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#D1FADF] text-[#0D8253] rounded-full border-2 border-[#0D1B2A] font-mono text-xs font-extrabold shadow-[2px_2px_0px_#0D1B2A]">
                  SUCCESS
                </span>
              </div>

              {/* Receipt Body */}
              <div className="bg-white rounded-2xl p-5 border-2 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A] space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Reference</span>
                  <span className="font-extrabold text-[#0D1B2A]">{reference}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Amount Sent</span>
                  <span className="text-lg font-black text-[#0D8253]">₦10,000.00</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Beneficiary</span>
                  <span className="font-extrabold text-[#0D1B2A]">Adewale Ogunleye</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Auth Method</span>
                  <span className="text-[#0D1B2A] font-bold">Face Liveness (Biometric)</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Language</span>
                  <span className="text-[#0D1B2A] font-bold">{langData.name} ({langData.code})</span>
                </div>
                <div className="pt-2 border-t-2 border-[#0D1B2A]/15 flex justify-between items-center">
                  <span className="text-gray-600 font-bold">Updated Balance</span>
                  <span className="font-black text-[#0D8253] text-sm">{formatNaira(balance)}</span>
                </div>
              </div>

              {/* Spoken Confirmation banner */}
              <div className="p-3 bg-[#EEF2FF] rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-xs text-[#0D1B2A] flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#4338CA] shrink-0" />
                <span className="font-medium">Audio: “{langData.successText}”</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="retro-btn-primary flex-1 py-3 px-4 text-xs font-extrabold cursor-pointer"
                >
                  Done (New Transaction)
                </button>
                {onViewHistory && (
                  <button
                    onClick={onViewHistory}
                    className="retro-btn-secondary py-3 px-4 text-xs font-bold cursor-pointer"
                  >
                    View in Ledger
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Terminal Bottom Controls / Reset Bar */}
        <div className="bg-[#FAF5EC] px-6 py-3 border-t-2 border-[#0D1B2A]/15 flex items-center justify-between text-xs text-gray-700">
          <span className="font-mono font-medium">Cycle: 20-30 seconds end-to-end</span>
          <button
            onClick={handleReset}
            className="text-[#0D1B2A] hover:text-[#FF4646] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </section>
  );
};
