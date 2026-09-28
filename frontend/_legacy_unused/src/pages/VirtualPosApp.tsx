import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Volume2, ShieldCheck, CheckCircle2, RotateCcw, ArrowRight, UserCheck, 
  XCircle, Sparkles, RefreshCw, Printer, Check, User, ArrowLeft, Camera, 
  AlertTriangle, Phone, Building2, CreditCard, ChevronRight, Share2 
} from 'lucide-react';
import { Language, Customer, Transaction } from '../types';
import { LANGUAGES, QUICK_VOICE_COMMANDS } from '../lib/phrases';
import { playChime, speakConfirmation, stopSpeaking } from '../lib/audio';
import { getStoredCustomers, getActiveCustomer, setActiveCustomerId, recordTransaction, formatNaira, resetDemoState } from '../lib/store';

type PosStep = 'customer' | 'ready' | 'listening' | 'understood' | 'verifying' | 'success';

interface VirtualPosAppProps {
  onNavigate: (route: string) => void;
}

export const VirtualPosApp: React.FC<VirtualPosAppProps> = ({ onNavigate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(getActiveCustomer());
  const [selectedLang, setSelectedLang] = useState<Language>('yo');
  const [step, setStep] = useState<PosStep>('ready');
  const [audioTranscript, setAudioTranscript] = useState('');
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [balance, setBalance] = useState(25400);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const langInfo = LANGUAGES[selectedLang];

  useEffect(() => {
    const list = getStoredCustomers();
    setCustomers(list);
    const active = getActiveCustomer();
    setSelectedCustomer(active);
    setSelectedLang(active.preferredLanguage);
    setBalance(active.balance);

    const onStateChange = () => {
      const updatedList = getStoredCustomers();
      setCustomers(updatedList);
      const updatedActive = getActiveCustomer();
      setSelectedCustomer(updatedActive);
      setBalance(updatedActive.balance);
    };

    window.addEventListener('elderpay_state_changed', onStateChange);
    return () => window.removeEventListener('elderpay_state_changed', onStateChange);
  }, []);

  // Try real camera if accessible, or fallback to simulated scan HUD
  const startCameraFeed = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCameraFeed = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSelectCustomer = (c: Customer) => {
    playChime('click');
    setActiveCustomerId(c.id);
    setSelectedCustomer(c);
    setSelectedLang(c.preferredLanguage);
    setBalance(c.balance);
    setStep('ready');
  };

  const handleStartSpeaking = (commandText?: string) => {
    stopSpeaking();
    playChime('listen');
    setStep('listening');
    setAudioTranscript('');

    const targetText = commandText || langInfo.samplePhrase;
    let index = 0;
    const interval = setInterval(() => {
      if (index <= targetText.length) {
        setAudioTranscript(targetText.slice(0, index));
        index += 2;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          playChime('understood');
          setStep('understood');
          setIsSpeaking(true);
          speakConfirmation(langInfo.confirmationText, () => setIsSpeaking(false));
        }, 500);
      }
    }, 40);
  };

  const handleConfirm = () => {
    stopSpeaking();
    playChime('verify');
    setStep('verifying');
    setScanProgress(0);
    startCameraFeed();

    let p = 0;
    const interval = setInterval(() => {
      p += 12;
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          stopCameraFeed();
          const tx = recordTransaction({
            type: 'transfer',
            amount: 10000,
            recipient: 'Adewale Ogunleye',
            recipientAccount: '0129482711',
            recipientBank: 'Wema Bank (ElderPay)',
            sender: selectedCustomer.name,
            language: selectedLang,
            voiceTranscript: audioTranscript || langInfo.samplePhrase,
            fee: 0,
            verificationMethod: 'face_verification'
          });

          setLatestTx(tx);
          setBalance(prev => Math.max(0, prev - 10000));
          setStep('success');
          playChime('success');
          speakConfirmation(langInfo.successText);
        }, 350);
      }
    }, 120);
  };

  const handleReset = () => {
    stopSpeaking();
    stopCameraFeed();
    setStep('ready');
    setAudioTranscript('');
    playChime('click');
  };

  const handleCompleteReset = () => {
    resetDemoState();
    stopSpeaking();
    stopCameraFeed();
    setStep('ready');
    setAudioTranscript('');
    playChime('click');
  };

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-[#0D1B2A]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation & Status bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#0D1B2A]/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="retro-btn-secondary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
              <span className="text-xs font-mono font-bold text-[#0D1B2A]">
                TERMINAL POS-LOS-402 (ONLINE)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#FF4646] text-white font-mono font-bold px-3 py-1.5 rounded-full border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
              SAHARA HACKATHON DEMO
            </span>
            <button
              onClick={handleCompleteReset}
              className="text-xs text-gray-700 hover:text-black flex items-center gap-1 font-bold underline cursor-pointer ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Data
            </button>
          </div>
        </div>

        {/* Evaluation Flow Banner in Dark Navy PayCart Style */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1B2A] text-white border-3 border-[#0D1B2A] shadow-[5px_5px_0px_#FF4646] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2 text-[#FF4646] font-extrabold text-xs uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-[#FF4646]" />
              <span>Target Judge Evaluation Flow (20-30s)</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">
              1. Customer → 2. Language → 3. Speak Intent → 4. AI Interprets → 5. Confirm & Face Check → 6. Instant Receipt.
            </p>
          </div>
          <button
            onClick={() => handleStartSpeaking()}
            className="retro-btn-primary px-4 py-2.5 text-xs font-black whitespace-nowrap cursor-pointer shrink-0"
          >
            Quick Test Transfer (₦10,000)
          </button>
        </div>

        {/* Customer & Language Selection Bar in PayCart Style */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Customer profile card */}
          <div className="md:col-span-7 bg-white p-4 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={selectedCustomer.avatar}
                alt={selectedCustomer.name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#FF4646]"
              />
              <div>
                <h4 className="font-black text-sm text-[#0D1B2A]">{selectedCustomer.name}</h4>
                <p className="text-xs text-gray-600 font-mono">{selectedCustomer.phone} · BVN: {selectedCustomer.bvnMasked}</p>
                <p className="text-[11px] text-[#0D8253] font-mono font-bold mt-0.5">
                  Balance: {formatNaira(balance)}
                </p>
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <div>
              <select
                value={selectedCustomer.id}
                onChange={(e) => {
                  const target = customers.find(c => c.id === e.target.value);
                  if (target) handleSelectCustomer(target);
                }}
                className="text-xs font-bold bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] rounded-xl px-2.5 py-1.5 text-[#0D1B2A] focus:outline-none cursor-pointer"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({LANGUAGES[c.preferredLanguage].name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Language selector buttons */}
          <div className="md:col-span-5 bg-white p-2.5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex items-center justify-between gap-1.5 overflow-x-auto">
            {(Object.keys(LANGUAGES) as Language[]).map(code => (
              <button
                key={code}
                onClick={() => {
                  playChime('click');
                  setSelectedLang(code);
                  if (step !== 'ready') setStep('ready');
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex-1 text-center border-2 ${
                  selectedLang === code
                    ? 'bg-[#FF4646] text-white border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]'
                    : 'text-[#0D1B2A] border-transparent hover:bg-[#FAF5EC]'
                }`}
              >
                <div>{LANGUAGES[code].name}</div>
                <div className="text-[9px] font-mono opacity-80">{code.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Virtual POS Kiosk Screen */}
        <div className="bg-white rounded-3xl border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#0D1B2A] overflow-hidden">
          {/* Top Status Strip */}
          <div className="bg-[#0D1B2A] text-white px-6 py-3.5 flex items-center justify-between text-xs font-mono border-b-2 border-[#0D1B2A]">
            <div className="flex items-center gap-2">
              <span className="text-[#10B981] font-bold">SESSION: #POS-2026-ACTIVE</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300 font-bold">DIALECT: {langInfo.name.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">LEDGER BALANCE:</span>
              <span className="font-black text-[#10B981]">{formatNaira(balance)}</span>
            </div>
          </div>

          {/* Dynamic Content Body */}
          <div className="p-6 sm:p-12 min-h-[460px] flex flex-col justify-center items-center text-center bg-[#FAF5EC]">
            {/* STEP: READY TO SPEAK */}
            {step === 'ready' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-7 max-w-lg w-full"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-[#0D1B2A] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A]">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4646]" />
                    <span>Step 1 of 5: Voice Initiation</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#0D1B2A] font-display mt-3">
                    {langInfo.greeting}
                  </h3>
                  <p className="text-sm text-gray-700 font-medium mt-1">
                    Press the microphone button and state your request in {langInfo.name}.
                  </p>
                </div>

                {/* Big Microphone button in PayCart Neo-Brutalist Style */}
                <div className="relative mx-auto w-28 h-28">
                  <button
                    onClick={() => handleStartSpeaking()}
                    className="relative w-28 h-28 rounded-full bg-[#FF4646] text-white flex flex-col items-center justify-center border-3 border-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1.5 active:translate-y-1.5 active:shadow-none transition-all cursor-pointer group"
                  >
                    <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider mt-1 text-white">
                      TAP & SPEAK
                    </span>
                  </button>
                </div>

                {/* Preset quick test phrases */}
                <div className="space-y-2 pt-2 text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-600 block text-center">
                    OR SELECT PRE-CONFIGURED COMMAND
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {QUICK_VOICE_COMMANDS.map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedLang(cmd.language);
                          handleStartSpeaking(cmd.text);
                        }}
                        className="p-3 bg-white hover:bg-[#FEF3C7] rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-left transition-all cursor-pointer group"
                      >
                        <span className="font-bold text-[#FF4646] block font-mono text-[10px] uppercase">
                          {cmd.translation}
                        </span>
                        <span className="text-[#0D1B2A] italic font-serif text-[11px] block mt-0.5 line-clamp-1 font-medium">
                          “{cmd.text}”
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: LISTENING */}
            {step === 'listening' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-md w-full"
              >
                <div className="relative mx-auto w-24 h-24 rounded-full bg-[#FF4646] text-white flex items-center justify-center border-3 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A]">
                  <Mic className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full bg-white text-[#0D1B2A] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
                    <span>Listening in {langInfo.name}...</span>
                  </span>

                  <div className="p-4 bg-white rounded-2xl border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] min-h-[64px] flex items-center justify-center">
                    <p className="text-base text-[#0D1B2A] font-serif italic font-medium">
                      “{audioTranscript || 'Listening to customer speech...'}”
                    </p>
                  </div>
                </div>

                {/* Animated sound wave bars in dark navy */}
                <div className="flex items-center justify-center gap-1.5 h-12">
                  {[20, 36, 44, 28, 48, 32, 24, 40, 22, 34, 42, 18, 30].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [h * 0.35, h, h * 0.35] }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: 'easeInOut'
                      }}
                      className="w-1.5 bg-[#0D1B2A] rounded-full"
                      style={{ height: h }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP: UNDERSTOOD & READBACK */}
            {step === 'understood' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-lg w-full text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#0D1B2A]/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#0D8253]" />
                    <h3 className="text-base font-black text-[#0D1B2A] font-display">
                      Understood: Direct Bank Transfer
                    </h3>
                  </div>
                  <span className="text-xs bg-[#D1FADF] text-[#0D1B2A] font-mono font-bold px-3 py-1 rounded-full border-2 border-[#0D1B2A]">
                    Confidence: 99.4%
                  </span>
                </div>

                {/* Extracted Entity Payload */}
                <div className="bg-white rounded-2xl p-5 border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] space-y-3.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-mono uppercase tracking-wider text-[10px] font-bold">OPERATIONAL INTENT</span>
                    <span className="font-black text-[#0D1B2A]">TRANSFER_FUNDS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-mono uppercase tracking-wider text-[10px] font-bold">AMOUNT</span>
                    <span className="text-2xl font-black text-[#FF4646] font-mono">₦10,000.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-mono uppercase tracking-wider text-[10px] font-bold">BENEFICIARY</span>
                    <span className="font-bold text-[#0D1B2A]">Adewale Ogunleye</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-mono uppercase tracking-wider text-[10px] font-bold">RECIPIENT BANK / NUBAN</span>
                    <span className="font-mono font-bold text-[#0D1B2A]">Wema Bank (0129482711)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-[#0D1B2A]/10 text-gray-700">
                    <span className="uppercase tracking-wider text-[10px] font-mono font-bold">ESTIMATED FEE</span>
                    <span className="font-bold text-[#0D8253]">₦0.00 (Agent Tier 1 promo)</span>
                  </div>
                </div>

                {/* Spoken Native Confirmation Notice in Yellow */}
                <div className="p-4 bg-[#FEF3C7] rounded-2xl border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-xs flex items-start gap-3">
                  <Volume2 className={`w-5 h-5 text-[#FF4646] shrink-0 mt-0.5 ${isSpeaking ? 'animate-bounce' : ''}`} />
                  <div>
                    <strong className="text-[#0D1B2A] block font-bold">Voice Readback ({langInfo.name}):</strong>
                    <p className="text-gray-800 italic mt-0.5 leading-relaxed font-medium">
                      “{langInfo.confirmationText}”
                    </p>
                  </div>
                </div>

                {/* Action Buttons: Confirm, Repeat, Cancel in PayCart Style */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="retro-btn-secondary py-3 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-gray-500" />
                    <span>Cancel</span>
                  </button>

                  <button
                    onClick={() => {
                      playChime('click');
                      setIsSpeaking(true);
                      speakConfirmation(langInfo.confirmationText, () => setIsSpeaking(false));
                    }}
                    className="retro-btn-secondary py-3 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-[#FF4646]" />
                    <span>Repeat</span>
                  </button>

                  <button
                    onClick={handleConfirm}
                    className="retro-btn-primary py-3 px-4 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Verify</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: FACE VERIFICATION */}
            {step === 'verifying' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-md w-full"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#0D1B2A] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-xs font-mono font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#FF4646]" />
                  <span>STEP 4 OF 5: BIOMETRIC FACE VERIFICATION</span>
                </div>

                {/* Viewfinder Frame with Real or Simulated Camera */}
                <div className="relative mx-auto w-56 h-64 rounded-3xl border-3 border-[#0D1B2A] bg-[#0D1B2A] shadow-[6px_6px_0px_#0D1B2A] overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Corner Targets */}
                  <div className="absolute top-3 left-3 w-5 h-5 border-t-3 border-l-3 border-[#FF4646]" />
                  <div className="absolute top-3 right-3 w-5 h-5 border-t-3 border-r-3 border-[#FF4646]" />
                  <div className="absolute bottom-3 left-3 w-5 h-5 border-b-3 border-l-3 border-[#FF4646]" />
                  <div className="absolute bottom-3 right-3 w-5 h-5 border-b-3 border-r-3 border-[#FF4646]" />

                  {/* Laser Scanning Line */}
                  <motion.div
                    animate={{ y: [-110, 110] }}
                    transition={{ duration: 1.1, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-[#FF4646] shadow-[0_0_14px_#FF4646] z-20"
                  />

                  {/* Face Silhouette fallback if camera not active */}
                  {!cameraActive && (
                    <div className="w-28 h-36 rounded-t-full rounded-b-3xl border-2 border-dashed border-[#FF4646]/60 flex flex-col items-center justify-center p-2 z-10">
                      <div className="w-10 h-10 rounded-full border-2 border-[#FF4646]/60 mb-1" />
                      <div className="w-16 h-16 rounded-t-2xl border-2 border-[#FF4646]/60" />
                    </div>
                  )}

                  <span className="absolute bottom-3 font-mono text-[10px] text-white font-bold bg-[#0D1B2A]/90 border border-white/20 px-3 py-1 rounded-full z-30">
                    MATCHING DESCRIPTOR: {scanProgress}%
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#0D1B2A] font-display">
                    {scanProgress < 100 ? 'Scanning Customer Face...' : 'Face Verified ✓'}
                  </h4>
                  <p className="text-xs text-gray-700 font-medium max-w-xs mx-auto">
                    Biometric feature vector matches enrolled profile for <strong className="text-[#0D1B2A]">{selectedCustomer.name}</strong>.
                  </p>
                  <p className="text-[10px] text-gray-500 italic font-mono">
                    *ElderPay passive liveness & template match.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP: TRANSACTION SUCCESS RECEIPT */}
            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 max-w-lg w-full text-left"
              >
                {/* Header Banner */}
                <div className="bg-[#D1FADF] border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0D8253] text-white flex items-center justify-center font-black text-lg border-2 border-[#0D1B2A]">
                      ✓
                    </div>
                    <div>
                      <h3 className="font-black text-base text-[#0D1B2A] font-display">
                        Transfer Successful
                      </h3>
                      <p className="text-xs text-[#0D8253] font-bold">
                        ₦10,000 sent to Adewale Ogunleye
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#0D1B2A] bg-white px-2.5 py-1 rounded-lg border-2 border-[#0D1B2A]">
                    COMPLETED
                  </span>
                </div>

                {/* Printable Receipt Card */}
                <div className="bg-white p-6 rounded-2xl border-2 border-[#0D1B2A] shadow-[5px_5px_0px_#0D1B2A] space-y-3 font-mono text-xs">
                  <div className="text-center pb-3 border-b-2 border-[#0D1B2A]/10">
                    <span className="font-display font-black text-lg text-[#0D1B2A]">
                      ELDER<span className="text-[#FF4646]">PAY</span> RECEIPT
                    </span>
                    <p className="text-[10px] text-gray-600">Terminal #LOS-402 · Agent Kazeem Babatunde</p>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Reference</span>
                    <span className="font-bold text-[#0D1B2A]">{latestTx?.reference || 'EP-2026-92841'}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Date & Time</span>
                    <span className="text-[#0D1B2A] font-bold">{latestTx?.date || 'Today'} {latestTx?.time || '14:30'}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Sender</span>
                    <span className="font-bold text-[#0D1B2A]">{selectedCustomer.name}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Recipient</span>
                    <span className="font-bold text-[#0D1B2A]">Adewale Ogunleye</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Amount Transferred</span>
                    <span className="text-lg font-black text-[#FF4646]">₦10,000.00</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span>Auth Verification</span>
                    <span className="text-[#0D8253] font-bold">Face Biometric (Passed)</span>
                  </div>

                  <div className="pt-3 border-t-2 border-[#0D1B2A]/10 flex justify-between items-center text-sm font-black">
                    <span className="text-[#0D1B2A]">New Balance</span>
                    <span className="text-[#0D8253] text-base">{formatNaira(balance)}</span>
                  </div>
                </div>

                {/* Spoken Confirmation Banner */}
                <div className="p-3 bg-white rounded-xl border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] text-xs text-[#0D1B2A] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#FF4646] shrink-0" />
                  <span className="font-medium">
                    <strong className="font-bold">Spoken Audio:</strong> “{langInfo.successText}”
                  </span>
                </div>

                {/* Action Buttons in PayCart Style */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 retro-btn-primary py-3 px-4 text-xs font-black cursor-pointer text-center"
                  >
                    Done (Start New Transaction)
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="retro-btn-secondary py-3 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/history')}
                    className="retro-btn-secondary py-3 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
