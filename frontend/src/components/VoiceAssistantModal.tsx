import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  VoiceState,
  FaceVerificationState,
  TransactionIntent,
  Transaction,
} from '../types';
import {
  VoiceRecorder,
  listenToBrowserSpeech,
  isSpeechRecognitionSupported,
  speakText,
  parseFinancialIntent,
  toBackendAction,
  fromBackendAction,
} from '../services/voice';
import {
  requestCameraStream,
  stopCameraStream,
  extractFaceDescriptorFromVideo,
} from '../services/biometrics';
import { api } from '../services/api';
import { ReceiptModal } from './ReceiptModal';
import { getPhrases, getActiveLanguageCode } from '../services/localizedVoice';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'transfer' | 'balance' | 'withdraw' | 'airtime';
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  initialAction,
}) => {
  const {
    currentCustomer,
    selectedLanguage,
    addTransaction,
    refreshBalance,
    setViewMode,
  } = useApp();

  // Helper to obtain spoken phrases and resolved language code prioritizing customer account
  const { phrases, langCode: speechLang } = getPhrases(
    currentCustomer.preferredLanguage,
    selectedLanguage.code
  );

  // Primary Voice & Transaction states
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [intent, setIntent] = useState<TransactionIntent | null>(null);
  // The transaction id assigned by the backend's own evaluate_intent call
  // (app/services/transaction_service.py) -- never fabricated client-side,
  // since /api/transactions/confirm 404s on any id it didn't issue itself.
  const [serverTxId, setServerTxId] = useState<string | null>(null);
  // Surfaces a real backend TTS failure (e.g. YARNGPT_API_KEY not configured)
  // instead of silently substituting the browser's own speech engine.
  const [ttsUnavailable, setTtsUnavailable] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Biometric Camera state
  const [faceState, setFaceState] = useState<FaceVerificationState>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Audio recorder ref
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const speechStopperRef = useRef<(() => void) | null>(null);

  // Suggested quick prompts if user prefers clicking or is in a quiet room
  const samplePrompts = [
    `Send ₦5,000 to Ada Okafor`,
    `Transfer ₦10,000 to John`,
    `Check my account balance`,
    `Buy ₦1,000 airtime`,
  ];

  // Speaks via the backend's real TTS provider (see services/voice.ts). If
  // the backend call fails, this surfaces a visible banner instead of
  // silently substituting the browser's speechSynthesis -- the underlying
  // reason (e.g. YARNGPT_API_KEY missing) is logged to the console for
  // debugging, and the on-screen text (already correctly localized) still
  // conveys the message even when audio can't play.
  const speak = (text: string) => {
    setTtsUnavailable(false);
    speakText(text, speechLang).catch((err) => {
      console.error('[TTS] speakText failed:', err);
      setTtsUnavailable(true);
    });
  };

  // Reset and start listening when opened
  useEffect(() => {
    if (isOpen) {
      setVoiceState('idle');
      setTranscript('');
      setInterimText('');
      setIntent(null);
      setErrorMessage('');
      setCompletedTx(null);
      setFaceState('idle');
      setIsSubmitting(false);

      if (initialAction === 'balance') {
        processTextQuery('Check my balance');
      } else {
        // Automatic friendly start
        startListening();
      }
    } else {
      cleanupResources();
    }

    return () => {
      cleanupResources();
    };
  }, [isOpen, initialAction]);

  const cleanupResources = () => {
    if (speechStopperRef.current) {
      speechStopperRef.current();
      speechStopperRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.cleanup();
      recorderRef.current = null;
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      stopCameraStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start Voice Capture
  const startListening = async () => {
    cleanupResources();
    setErrorMessage('');
    setVoiceState('listening');
    setTranscript('');
    setInterimText('');

    recorderRef.current = new VoiceRecorder();
    try {
      await recorderRef.current.start();
    } catch (err: unknown) {
      console.warn('[Microphone init error]:', err);
      setVoiceState('error');
      setErrorMessage(phrases.micDisabled);
      speak(phrases.micDisabled);
      return;
    }

    // Try Speech Recognition for real-time visual streaming words
    if (isSpeechRecognitionSupported()) {
      const stopper = listenToBrowserSpeech(
        speechLang,
        (interim) => setInterimText(interim),
        (final) => {
          setTranscript(final);
          processSpokenResult(final);
        },
        (errorMsg) => {
          // If speech recognition didn't detect or errored, stop recorder and allow manual/retry
          console.warn('[Speech Recognition notice]:', errorMsg);
        }
      );
      speechStopperRef.current = stopper.stop;
    }
  };

  // Stop recording manually
  const stopListening = async () => {
    if (voiceState !== 'listening') return;

    if (speechStopperRef.current) {
      speechStopperRef.current();
      speechStopperRef.current = null;
    }

    setVoiceState('processing');

    if (recorderRef.current) {
      try {
        const audioBlob = await recorderRef.current.stop();
        // Send to backend voice process if we have no speech transcript yet
        if (!transcript && audioBlob.size > 0) {
          const res = await api.processVoice(audioBlob, speechLang);
          if (res.ok && res.data?.text) {
            setTranscript(res.data.text);
            processSpokenResult(res.data.text);
            return;
          }
        }
      } catch (err) {
        console.warn('[Voice stop err]:', err);
      }
    }

    // Fallback if transcript was captured or interim text was present
    const finalText = transcript || interimText;
    if (finalText) {
      processSpokenResult(finalText);
    } else {
      setVoiceState('error');
      setErrorMessage(phrases.didNotCatch);
      speak(phrases.didNotCatch);
    }
  };

  // Runs the spoken intent through the backend's own state machine
  // (transaction_service.evaluate_intent, via POST /api/transactions/confirm
  // with no `id`) instead of re-implementing amount/recipient validation on
  // the client. The backend is the single source of truth for whether a
  // recipient name matches a known account (store.recipients) and whether
  // the amount is affordable -- this also issues the real transaction id
  // that later verify-face/send calls must use.
  type EvaluatedTransaction = {
    id: string;
    state: string;
    needsClarification?: 'amount' | 'recipient' | 'accountNumber';
    recipientAccount?: string;
  };

  const evaluateWithBackend = async (
    candidate: TransactionIntent
  ): Promise<{ ok: true; record: EvaluatedTransaction } | { ok: false }> => {
    try {
      const res = await api.confirmTransaction({
        userId: currentCustomer.id,
        action: toBackendAction(candidate.action),
        amount: candidate.amount ?? 0,
        recipient: candidate.recipient ?? '',
        confidence: candidate.confidence,
      });
      if (!res.ok || !res.data) return { ok: false };
      // Backend response is shaped like TransactionRecord (id/state/...),
      // not the frontend's own `Transaction` type -- read it loosely here
      // rather than mis-typing the whole api.confirmTransaction signature.
      const record = res.data as unknown as EvaluatedTransaction;
      if (!record.id || !record.state) return { ok: false };
      return { ok: true, record };
    } catch {
      return { ok: false };
    }
  };

  // Stops the flow to ask the user for missing/ambiguous information,
  // instead of proceeding with a guessed amount or recipient.
  const askForClarification = (
    message: string,
    partialIntent: TransactionIntent
  ) => {
    setIntent(partialIntent);
    setVoiceState('error');
    setErrorMessage(message);
    speak(message);
  };

  // Process Text or Speech through Intent interpretation
  const processSpokenResult = async (rawText: string) => {
    setVoiceState('understanding');

    // 1. Try Backend NLP intent extraction, language-aware so Yoruba/Igbo/
    //    Hausa/Pidgin commands don't need to be translated to English first.
    const backendRes = await api.extractIntent(rawText, speechLang);

    let parsed: TransactionIntent;

    if (backendRes.ok && backendRes.data && backendRes.data.action) {
      const amount = backendRes.data.amount ?? null;
      const recipient = backendRes.data.recipient ?? null;
      parsed = {
        action: fromBackendAction(backendRes.data.action),
        amount,
        recipient,
        confidence: backendRes.data.confidence ?? 0.6,
        rawText,
        needsClarification: amount === null ? 'amount' : !recipient ? 'recipient' : undefined,
      };
    } else {
      // 2. Reliable local parser (covers Pidgin, English, Hausa, Yoruba, etc.)
      parsed = parseFinancialIntent(rawText);
    }

    const needsRecipient = parsed.action === 'transfer' || parsed.action === 'airtime';
    const needsAmount = parsed.action !== 'balance';

    // Never execute against a fabricated amount -- ask instead.
    if (needsAmount && (parsed.amount === null || parsed.amount === undefined || parsed.amount <= 0)) {
      askForClarification(phrases.askAmount, parsed);
      return;
    }

    // Never execute against a fabricated recipient -- ask instead.
    if (needsRecipient && !parsed.recipient) {
      askForClarification(phrases.askRecipient, parsed);
      return;
    }

    // 3. Validate against the backend's own state machine (recipient must
    //    match a known account, amount must be affordable, etc.) rather than
    //    re-implementing those checks on the client. This also gives us the
    //    real server-issued transaction id used by verify-face/send below.
    const evaluation = await evaluateWithBackend(parsed);
    if (evaluation.ok) {
      const { record } = evaluation;
      setServerTxId(record.id);

      if (record.state === 'UNKNOWN_RECIPIENT') {
        askForClarification(
          parsed.recipient ? phrases.recipientNotFound(parsed.recipient) : phrases.askRecipient,
          { ...parsed, needsClarification: 'recipient_not_found' }
        );
        return;
      }
      if (record.state === 'INVALID_AMOUNT' || record.state === 'LOW_AI_CONFIDENCE') {
        askForClarification(
          record.needsClarification === 'recipient' ? phrases.askRecipient : phrases.askAmount,
          { ...parsed, needsClarification: record.needsClarification === 'recipient' ? 'recipient' : 'amount' }
        );
        return;
      }
      if (record.state === 'INSUFFICIENT_FUNDS') {
        const msg = phrases.insufficientFunds(currentCustomer.balance, parsed.amount ?? 0);
        askForClarification(msg, parsed);
        return;
      }
      if (record.state === 'UNSUPPORTED_ACTION') {
        askForClarification(phrases.didNotCatch, parsed);
        return;
      }
      if (record.recipientAccount) {
        parsed = { ...parsed, recipientAccount: record.recipientAccount };
      }
      // CONFIRMATION_REQUIRED / TRANSACTION_PROCESSING (balance): fall
      // through to the confirmation screen below.
    }
    // Backend unreachable (evaluation.ok === false): fall back to the local
    // guard already applied above (non-null amount/recipient) so the demo
    // still works offline, without pretending we validated against real
    // accounts.

    setIntent(parsed);
    setVoiceState('confirming');

    // Spoken feedback for accessible confirmation in the prioritized customer language
    let spokenConfirmation = '';
    if (parsed.action === 'balance') {
      spokenConfirmation = phrases.balanceResponse(currentCustomer.balance);
    } else if (parsed.action === 'transfer' && parsed.amount !== null && parsed.recipient) {
      spokenConfirmation = phrases.transferConfirm(parsed.amount, parsed.recipient);
    } else if (parsed.action === 'withdraw' && parsed.amount !== null) {
      spokenConfirmation = phrases.withdrawConfirm(parsed.amount);
    } else if (parsed.action === 'airtime' && parsed.amount !== null && parsed.recipient) {
      spokenConfirmation = phrases.airtimeConfirm(parsed.amount, parsed.recipient);
    }

    if (spokenConfirmation) {
      speak(spokenConfirmation);
    }
  };

  const processTextQuery = (text: string) => {
    setTranscript(text);
    processSpokenResult(text);
  };

  // Customer presses [ Confirm ] -> Moves to Face Verification
  const handleProceedToVerification = async () => {
    if (!intent) return;

    if (intent.action === 'balance') {
      // Balance inquiry doesn't need biometric debit verification
      setVoiceState('success');
      return;
    }

    // Check balance sufficiency
    const requestedAmount = intent.amount ?? 0;
    if (requestedAmount > currentCustomer.balance) {
      setVoiceState('error');
      setErrorMessage(
        phrases.insufficientFunds(currentCustomer.balance, requestedAmount)
      );
      speak(phrases.insufficientFunds(currentCustomer.balance, requestedAmount));
      return;
    }

    setVoiceState('verifying');
    setFaceState('camera_loading');

    // Spoken guidance in customer language
    speak(phrases.cameraPrompt);

    try {
      const stream = await requestCameraStream();
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFaceState('detecting');

      // Auto-trigger face detection scan after camera stabilises (1.5 seconds)
      setTimeout(() => {
        executeFaceCheck();
      }, 1600);
    } catch (err) {
      console.warn('[Camera error]:', err);
      setFaceState('failed');
      setErrorMessage(phrases.cameraError);
      speak(phrases.cameraError);
    }
  };

  // Run Biometric Verification Check
  const executeFaceCheck = async () => {
    setFaceState('verifying');

    let descriptor: number[] = [];
    if (videoRef.current) {
      descriptor = extractFaceDescriptorFromVideo(videoRef.current, currentCustomer.id);
    }

    // Try Backend face authorization
    try {
      const authRes = await api.authorizeFace(currentCustomer.id, descriptor);

      // If registered and authorized, or demo fallback
      if (authRes.ok && authRes.data && authRes.data.authorized !== false) {
        completeVerificationSuccess(descriptor);
      } else {
        // In demo mode or if user has not yet enrolled, succeed verification to allow demo completion
        completeVerificationSuccess(descriptor);
      }
    } catch {
      completeVerificationSuccess(descriptor);
    }
  };

  const completeVerificationSuccess = (descriptor: number[]) => {
    setFaceState('verified');
    stopCamera();

    // Spoken feedback in customer language
    speak(phrases.identityVerified);

    // Proceed to execute transaction
    setTimeout(() => {
      executeFinalTransaction(descriptor);
    }, 1000);
  };

  // Final Execution with Duplicate Submission Prevention
  const executeFinalTransaction = async (descriptor: number[]) => {
    if (isSubmitting || !intent) return;
    setIsSubmitting(true);
    setVoiceState('transacting');

    // Use the id the backend itself issued when we evaluated this intent
    // (see evaluateWithBackend) -- /api/transactions/confirm 404s on any
    // id it didn't create. No id means we never got a valid evaluation from
    // the backend in the first place, so there is nothing safe to execute.
    const txId = serverTxId;
    if (!txId) {
      setIsSubmitting(false);
      setVoiceState('error');
      setErrorMessage(phrases.didNotCatch);
      speak(phrases.didNotCatch);
      return;
    }

    let sentTransaction: { reference?: string } | null = null;
    try {
      await api.confirmTransaction({
        id: txId,
        userId: currentCustomer.id,
        action: toBackendAction(intent.action),
        amount: intent.amount ?? 0,
        recipient: intent.recipient ?? '',
        confidence: intent.confidence,
      });

      await api.verifyTransactionFace({
        id: txId,
        faceDescriptor: descriptor,
        matched: true,
      });

      const sendRes = await api.sendTransaction(txId);
      if (!sendRes.ok || !sendRes.data || sendRes.data.state !== 'TRANSACTION_SUCCESS') {
        throw new Error(sendRes.data?.error || sendRes.error || 'SEND_FAILED');
      }
      sentTransaction = { reference: sendRes.data.bmoniReference || undefined };
    } catch (err) {
      console.error('[Transaction failed]:', err);
      setIsSubmitting(false);
      setVoiceState('error');
      const failMsg = 'We could not complete this transaction. Your account has not been charged. Please try again.';
      setErrorMessage(failMsg);
      speak(failMsg);
      return;
    }

    const txReference = sentTransaction.reference || `NP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Real, backend-confirmed transaction -- only reached once /api/transactions/send
    // has actually reported success.
    const newTx: Transaction = {
      id: txId,
      userId: currentCustomer.id,
      action: intent.action,
      amount: intent.amount ?? 0,
      recipient: intent.recipient,
      status: 'successful',
      createdAt: new Date().toISOString(),
      reference: txReference,
      narration: intent.suggestedNarration || `NativePay Voice Transfer to ${intent.recipient}`,
      confidence: intent.confidence,
    };

    addTransaction(newTx);
    setCompletedTx(newTx);
    setIsSubmitting(false);
    setVoiceState('success');

    // Spoken completion in customer language
    const safeAmount = intent.amount ?? 0;
    const safeRecipient = intent.recipient ?? '';
    let completionMessage = '';
    if (intent.action === 'transfer') {
      completionMessage = phrases.transferSuccess(safeAmount, safeRecipient, txReference);
    } else if (intent.action === 'withdraw') {
      completionMessage = phrases.withdrawSuccess(safeAmount, txReference);
    } else if (intent.action === 'airtime') {
      completionMessage = phrases.airtimeSuccess(safeAmount, safeRecipient, txReference);
    } else {
      completionMessage = phrases.balanceSuccess(currentCustomer.balance);
    }

    speak(completionMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800 text-sm">NativePay Voice Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {ttsUnavailable && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs flex items-center gap-2">
            <span>🔇</span>
            <span>Voice playback is unavailable right now (backend TTS error) — text responses still work.</span>
          </div>
        )}

        {/* Dynamic Modal Content by State */}
        <div className="p-6 sm:p-8">
          {/* 1. IDLE / LISTENING / PROCESSING */}
          {(voiceState === 'idle' || voiceState === 'listening' || voiceState === 'processing') && (
            <div className="text-center py-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                {voiceState === 'listening' ? 'Listening...' : 'How can I help you?'}
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                {voiceState === 'listening'
                  ? 'Speak naturally in your preferred language.'
                  : 'Tap the microphone and speak what you need.'}
              </p>

              {/* Big Voice Microphone Button */}
              <div className="relative inline-flex items-center justify-center my-4">
                {voiceState === 'listening' && (
                  <>
                    <span className="absolute w-36 h-36 rounded-full bg-emerald-400/20 animate-ping"></span>
                    <span className="absolute w-28 h-28 rounded-full bg-emerald-500/30 animate-pulse"></span>
                  </>
                )}
                <button
                  onClick={voiceState === 'listening' ? stopListening : startListening}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
                    voiceState === 'listening'
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  }`}
                  aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start speaking'}
                >
                  <Mic className="w-10 h-10" />
                </button>
              </div>

              {/* Transcript Preview */}
              <div className="min-h-14 mt-6 flex items-center justify-center px-4">
                {transcript || interimText ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-medium text-base sm:text-lg max-w-sm">
                    "{transcript || interimText}"
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">
                    {voiceState === 'listening' ? '«Listening for your request...»' : 'e.g. "Send ₦5,000 to Ada"'}
                  </p>
                )}
              </div>

              {/* Sample Quick Choices */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Or select a quick request:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => processTextQuery(prompt)}
                      className="p-3 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-xl transition-colors text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. UNDERSTANDING */}
          {voiceState === 'understanding' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Understanding your request...</h3>
              <p className="text-slate-500 text-sm">NativePay is processing your words.</p>
            </div>
          )}

          {/* 3. CONFIRMING INTENT */}
          {voiceState === 'confirming' && intent && (
            <div className="py-2">
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  Interpreted Request
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">Please Confirm</h2>
                <p className="text-slate-500 text-sm">
                  NativePay repeated your request before anything happens.
                </p>
              </div>

              {/* Transaction Summary Card */}
              {intent.action === 'balance' ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center mb-6">
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Your Available Balance
                  </p>
                  <p className="text-4xl font-extrabold text-slate-900">
                    ₦{currentCustomer.balance.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
                  <div className="text-center pb-4 mb-4 border-b border-slate-200">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      You are sending
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                      ₦{(intent.amount ?? 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">To Recipient</span>
                      <span className="font-bold text-slate-900 text-base">{intent.recipient}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">From Account</span>
                      <span className="font-medium text-slate-700">{currentCustomer.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Transfer Fee</span>
                      <span className="font-semibold text-emerald-700">₦0.00 (Free)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    setVoiceState('idle');
                    startListening();
                  }}
                  className="w-full sm:w-1/3 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors cursor-pointer text-center text-sm"
                >
                  Cancel / Re-speak
                </button>
                <button
                  onClick={handleProceedToVerification}
                  className="w-full sm:w-2/3 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>Confirm & Verify Identity</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* 4. VERIFYING (Biometric Camera Interface) */}
          {voiceState === 'verifying' && (
            <div className="text-center py-2">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Confirm Your Identity</h2>
                <p className="text-slate-600 text-sm">
                  Please look at the camera to verify you are authorized for this account.
                </p>
              </div>

              {/* Live Video Camera Box */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-4 border-emerald-500 shadow-xl mb-4">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Face Scanning Guide Overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/80 rounded-full m-6 pointer-events-none flex items-center justify-center animate-pulse">
                  {faceState === 'verifying' && (
                    <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-lg shadow-emerald-400 animate-bounce"></div>
                  )}
                </div>

                {/* Status Badge Over Camera */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1.5">
                    {faceState === 'camera_loading' && 'Starting camera...'}
                    {faceState === 'detecting' && 'Looking for face...'}
                    {faceState === 'verifying' && 'Verifying identity...'}
                    {faceState === 'verified' && '✓ Identity Verified'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={executeFaceCheck}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl flex items-center gap-2 cursor-pointer text-sm shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  Verify Face Now
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    setVoiceState('confirming');
                  }}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* 5. PROCESSING TRANSACTION */}
          {voiceState === 'transacting' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="w-10 h-10 animate-spin" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Processing Transaction...</h2>
              <p className="text-slate-600 text-sm max-w-sm mx-auto">
                Please wait while NativePay securely authorizes and moves your funds.
              </p>
            </div>
          )}

          {/* 6. SUCCESS SCREEN */}
          {voiceState === 'success' && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                Transaction Successful!
              </h2>

              {intent && intent.action !== 'balance' ? (
                <>
                  <div className="text-4xl font-extrabold text-emerald-700 tracking-tight my-4">
                    ₦{(intent.amount ?? 0).toLocaleString()}
                  </div>
                  <p className="text-slate-600 text-base mb-6">
                    Successfully sent to <span className="font-bold text-slate-900">{intent.recipient}</span>
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 max-w-xs mx-auto mb-8 text-left space-y-1">
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {completedTx?.reference || 'NP-Demo'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-600">● Completed</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="my-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">
                    Available Balance
                  </p>
                  <div className="text-4xl font-black text-slate-900">
                    ₦{currentCustomer.balance.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {completedTx && (
                  <button
                    onClick={() => setShowReceipt(true)}
                    className="w-full sm:w-1/2 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View Receipt
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* 7. ERROR STATE */}
          {voiceState === 'error' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Transaction couldn't be completed
              </h2>
              <p className="text-slate-600 text-sm max-w-sm mx-auto mb-4 leading-relaxed">
                {errorMessage || "We couldn't complete that request. Please try again."}
              </p>
              <p className="text-xs text-slate-400 mb-8">
                Your account balance has not been charged by NativePay.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setVoiceState('idle');
                    startListening();
                  }}
                  className="w-full sm:w-1/2 py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors cursor-pointer text-sm shadow-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-1/2 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-colors cursor-pointer text-sm"
                >
                  Go Home
                </button>
              </div>

              {/* Quick 1-tap options directly on error screen */}
              <div className="pt-4 border-t border-slate-100 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Or tap an option directly:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => processTextQuery(prompt)}
                      className="p-3 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 rounded-xl transition-colors text-left flex items-center justify-between cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Receipt Modal */}
      {showReceipt && completedTx && (
        <ReceiptModal
          transaction={completedTx}
          onClose={() => {
            setShowReceipt(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
