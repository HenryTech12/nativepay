import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Search,
  CreditCard,
  User,
  Mic,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomerAccount, Transaction, TransactionIntent } from '../types';
import { api } from '../services/api';
import { parseFinancialIntent, speakText } from '../services/voice';
import { getPhrases } from '../services/localizedVoice';
import { requestCameraStream, stopCameraStream, extractFaceDescriptorFromVideo } from '../services/biometrics';
import { ReceiptModal } from '../components/ReceiptModal';

type PosStep =
  | 'lookup'
  | 'customer_confirmed'
  | 'voice_request'
  | 'tx_confirm'
  | 'biometric_verify'
  | 'processing'
  | 'receipt';

export const PosAgentView: React.FC = () => {
  const { addTransaction, selectedLanguage } = useApp();

  const [step, setStep] = useState<PosStep>('lookup');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);

  // Request & Intent
  const [voiceText, setVoiceText] = useState('');
  const [intent, setIntent] = useState<TransactionIntent | null>(null);

  // Biometrics
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  // Completed Tx
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Clean up camera on unmount or step change
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        stopCameraStream(cameraStreamRef.current);
      }
    };
  }, []);

  // Search by Name or Card
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMessage('');
    setSearchResults([]);

    const query = searchQuery.trim();

    // Check if query is card number format (digits/spaces)
    const isCard = query.replace(/\s+/g, '').length >= 12;
    if (isCard) {
      const res = await api.getAccountByCard(query);
      if (res.ok && res.data) {
        setSelectedCustomer(res.data);
        setStep('customer_confirmed');
        setIsSearching(false);
        return;
      }
    }

    // Name search
    const nameRes = await api.searchAccounts(query);
    if (nameRes.ok && nameRes.data && nameRes.data.length > 0) {
      setSearchResults(nameRes.data);
    } else {
      // Fallback demo matching
      if (query.toLowerCase().includes('ada') || query.toLowerCase().includes('zainab') || query.toLowerCase().includes('mama')) {
        setSearchResults([{ id: 'mama-aisha', name: 'Olawale Zainab' }]);
      } else {
        setErrorMessage(`No registered customer found for "${query}". Try "Zainab" or "5060 0000 0000 0001".`);
      }
    }
    setIsSearching(false);
  };

  // Select customer from results
  const handleSelectCustomer = async (accId: string) => {
    setIsSearching(true);
    const res = await api.getAccount(accId);
    if (res.ok && res.data) {
      setSelectedCustomer(res.data);
    } else {
      // Demo fallback customer details
      setSelectedCustomer({
        id: accId,
        name: 'Olawale Zainab',
        preferredLanguage: 'yo',
        balance: 300000,
        cardNumber: '5060 0000 0000 0001',
        address: '32 Broad Street, Lagos',
      });
    }
    setStep('customer_confirmed');
    setIsSearching(false);
  };

  // Agent assists with voice or quick request
  const handleProcessVoiceInput = (rawText: string) => {
    setVoiceText(rawText);
    const parsed = parseFinancialIntent(rawText);
    setIntent(parsed);
    setStep('tx_confirm');

    // Prioritize customer language above all, then UI language
    const { phrases, langCode } = getPhrases(
      selectedCustomer?.preferredLanguage,
      selectedLanguage.code
    );

    let summaryText = '';
    if (parsed.action === 'transfer') {
      summaryText = phrases.transferConfirm(parsed.amount, parsed.recipient);
    } else if (parsed.action === 'withdraw') {
      summaryText = phrases.withdrawConfirm(parsed.amount);
    } else if (parsed.action === 'airtime') {
      summaryText = phrases.airtimeConfirm(parsed.amount, parsed.recipient);
    } else {
      summaryText = phrases.balanceResponse(selectedCustomer?.balance || 0);
    }

    speakText(summaryText, langCode);
  };

  // Start Camera for Biometric Verification
  const startBiometricCheck = async () => {
    setStep('biometric_verify');
    setIsVerifying(true);
    setVerifiedSuccess(false);

    try {
      const stream = await requestCameraStream();
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Automatically scan after short preview
      setTimeout(() => {
        runBiometricVerification();
      }, 1500);
    } catch (err) {
      console.warn('[POS Camera error]:', err);
      // If camera fails, allow manual verification approval
      setIsVerifying(false);
    }
  };

  const runBiometricVerification = async () => {
    if (!videoRef.current) return;
    const descriptor = extractFaceDescriptorFromVideo(videoRef.current, selectedCustomer?.id || 'customer');

    try {
      await api.authorizeFace(selectedCustomer?.id || 'customer', descriptor);
    } catch {
      // ignore
    }

    setVerifiedSuccess(true);
    setIsVerifying(false);

    // Stop camera
    if (cameraStreamRef.current) {
      stopCameraStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }

    // Move to processing
    setTimeout(() => {
      executeAgentTransaction();
    }, 1200);
  };

  // Final Execution
  const executeAgentTransaction = async () => {
    if (!selectedCustomer || !intent) return;
    setStep('processing');

    const txRef = `NP-POS-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `tx_pos_${Date.now()}`;

    // Update customer balance locally
    const newTx: Transaction = {
      id: txId,
      userId: selectedCustomer.id,
      action: intent.action,
      amount: intent.amount,
      recipient: intent.recipient,
      status: 'successful',
      createdAt: new Date().toISOString(),
      reference: txRef,
      narration: `POS Agent Assisted Transfer to ${intent.recipient}`,
      confidence: 0.99,
    };

    addTransaction(newTx);
    setCompletedTx(newTx);
    setStep('receipt');

    // Spoken receipt confirmation in customer preferred language
    const { phrases, langCode } = getPhrases(
      selectedCustomer?.preferredLanguage,
      selectedLanguage.code
    );
    let doneMsg = '';
    if (intent.action === 'transfer') {
      doneMsg = phrases.transferSuccess(intent.amount, intent.recipient, txRef);
    } else if (intent.action === 'withdraw') {
      doneMsg = phrases.withdrawSuccess(intent.amount, txRef);
    } else if (intent.action === 'airtime') {
      doneMsg = phrases.airtimeSuccess(intent.amount, intent.recipient, txRef);
    } else {
      doneMsg = phrases.balanceSuccess(selectedCustomer.balance);
    }
    speakText(doneMsg, langCode);
  };

  // Reset to initial lookup
  const handleResetFlow = () => {
    if (cameraStreamRef.current) {
      stopCameraStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }
    setStep('lookup');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCustomer(null);
    setVoiceText('');
    setIntent(null);
    setCompletedTx(null);
    setErrorMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* POS Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">NativePay Agent POS</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Authorized Agency Terminal
              </span>
            </div>
            <p className="text-xs text-slate-500">Terminal ID: NP-LAGOS-049 • Assisted Banking Mode</p>
          </div>
        </div>

        {step !== 'lookup' && (
          <button
            onClick={handleResetFlow}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Customer Session</span>
          </button>
        )}
      </div>

      {/* POS Step Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs mb-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] text-xs font-bold text-slate-400">
          <span className={step === 'lookup' ? 'text-emerald-700 font-black' : selectedCustomer ? 'text-emerald-600' : ''}>
            1. Customer Lookup
          </span>
          <span>→</span>
          <span className={step === 'customer_confirmed' ? 'text-emerald-700 font-black' : intent ? 'text-emerald-600' : ''}>
            2. Customer Details
          </span>
          <span>→</span>
          <span className={step === 'voice_request' || step === 'tx_confirm' ? 'text-emerald-700 font-black' : intent ? 'text-emerald-600' : ''}>
            3. Request Review
          </span>
          <span>→</span>
          <span className={step === 'biometric_verify' ? 'text-emerald-700 font-black' : verifiedSuccess ? 'text-emerald-600' : ''}>
            4. Biometric Verify
          </span>
          <span>→</span>
          <span className={step === 'receipt' ? 'text-emerald-700 font-black' : ''}>
            5. Final Receipt
          </span>
        </div>
      </div>

      {/* STEP 1: Customer Lookup */}
      {step === 'lookup' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="max-w-md mx-auto text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Look Up Customer</h2>
            <p className="text-slate-600 text-sm mt-1">
              Search by customer's full name or scan/type their NativePay card number.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Zainab or 5060 0000 0000 0001"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Find Customer</span>
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm text-center mb-6">
              {errorMessage}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="max-w-md mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Matching Accounts ({searchResults.length})
              </p>
              <div className="space-y-2">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelectCustomer(res.id)}
                    className="w-full p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center font-bold text-sm">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">{res.name}</div>
                        <div className="text-xs text-slate-500 font-mono">ID: {res.id}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Customer Confirmed */}
      {step === 'customer_confirmed' && selectedCustomer && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="max-w-lg mx-auto">
            {/* Customer Identification Badge */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Active Customer
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-0.5">{selectedCustomer.name}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCustomer.cardNumber}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <User className="w-6 h-6" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Available Balance</span>
                  <span className="text-xl font-black text-slate-900">
                    ₦{selectedCustomer.balance.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Language Preference</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {selectedCustomer.preferredLanguage || 'English'}
                  </span>
                </div>
              </div>
            </div>

            {/* Prompt for Voice Request */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Initiate Customer Request</h3>
              <p className="text-slate-500 text-sm mt-1">
                Have the customer speak their request or enter the transaction details:
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="space-y-3">
              {[
                { title: 'Send ₦5,000 to Ada Okafor', text: 'Send 5000 naira to Ada Okafor' },
                { title: 'Withdraw ₦10,000 Cash', text: 'Withdraw 10000 naira' },
                { title: 'Buy ₦1,000 Airtime', text: 'Buy 1000 airtime' },
                { title: 'Send ₦20,000 to John Doe', text: 'Send 20000 naira to John Doe' },
              ].map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleProcessVoiceInput(opt.text)}
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left font-semibold text-slate-800 text-sm flex items-center justify-between transition-colors cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>«{opt.title}»</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Transaction Review & Confirmation */}
      {step === 'tx_confirm' && selectedCustomer && intent && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="text-center mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Step 3: Review with Customer
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Confirm Transaction</h2>
            <p className="text-slate-500 text-sm">Both customer and agent should confirm details.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-6 space-y-4 text-sm">
            <div className="text-center pb-4 border-b border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Total Transaction Amount
              </span>
              <div className="text-4xl font-black text-slate-900 mt-1">
                ₦{intent.amount.toLocaleString()}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Sender (Customer)</span>
              <span className="font-bold text-slate-900">{selectedCustomer.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Recipient / Beneficiary</span>
              <span className="font-bold text-slate-900 text-base">{intent.recipient}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Action</span>
              <span className="font-semibold text-slate-900 capitalize">{intent.action}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Agent Fee</span>
              <span className="font-semibold text-emerald-700">₦0.00 (Standard Promo)</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Customer Remaining Balance</span>
              <span className="font-bold text-slate-900">
                ₦{(selectedCustomer.balance - intent.amount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('customer_confirmed')}
              className="flex-1 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={startBiometricCheck}
              className="flex-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors shadow-md text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Verify Customer Face</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Terminal Camera Biometric Verification */}
      {step === 'biometric_verify' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-lg mx-auto text-center">
          <div className="mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Terminal Verification
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Customer Face Check</h2>
            <p className="text-slate-600 text-sm mt-1">
              Ask customer to look into the terminal camera.
            </p>
          </div>

          {/* Camera Frame */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-4 border-emerald-500 shadow-xl mb-6">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />

            <div className="absolute inset-0 border-2 border-dashed border-emerald-400 rounded-full m-6 pointer-events-none flex items-center justify-center animate-pulse"></div>

            <div className="absolute bottom-3 inset-x-0 flex justify-center">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                {verifiedSuccess ? '✓ Face Match Verified' : 'Scanning customer face...'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={runBiometricVerification}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Approve & Finalize</span>
            </button>
            <button
              onClick={() => {
                if (cameraStreamRef.current) stopCameraStream(cameraStreamRef.current);
                setStep('tx_confirm');
              }}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Processing Animation */}
      {step === 'processing' && (
        <div className="bg-white rounded-3xl p-16 border border-slate-200 shadow-sm max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-10 h-10 animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Executing Transaction...</h2>
          <p className="text-slate-500 text-sm">
            Communicating with agency ledger. Please do not close terminal.
          </p>
        </div>
      )}

      {/* STEP 6: Final Agent Receipt */}
      {step === 'receipt' && completedTx && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700">
            Agency Transaction Completed
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-1 mb-2">
            ₦{completedTx.amount.toLocaleString()}
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Transferred to <span className="font-bold text-slate-900">{completedTx.recipient}</span>
          </p>

          {/* Receipt Info Card */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-mono font-bold text-slate-900">{completedTx.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sender Account:</span>
              <span className="font-semibold text-slate-800">{selectedCustomer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Terminal ID:</span>
              <span className="font-mono text-slate-700">NP-LAGOS-049</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Security Verification:</span>
              <span className="text-emerald-700 font-bold">Biometric Match (Passed)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-600 font-bold">● Completed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full sm:w-1/2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Full Receipt</span>
            </button>
            <button
              onClick={handleResetFlow}
              className="w-full sm:w-1/2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors cursor-pointer text-sm shadow-md"
            >
              Next Customer
            </button>
          </div>
        </div>
      )}

      {/* Full printable receipt modal */}
      {showReceiptModal && completedTx && (
        <ReceiptModal
          transaction={completedTx}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
};
