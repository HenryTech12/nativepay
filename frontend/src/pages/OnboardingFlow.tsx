import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus,
  Globe,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { useApp, SUPPORTED_LANGUAGES } from '../context/AppContext';
import { Language, CustomerAccount } from '../types';
import { api } from '../services/api';
import {
  requestCameraStream,
  stopCameraStream,
  extractFaceDescriptorFromVideo,
} from '../services/biometrics';
import { speakText } from '../services/voice';

type OnboardingStep = 'welcome' | 'info' | 'language' | 'face_enroll' | 'ready';

export const OnboardingFlow: React.FC = () => {
  const { setCurrentCustomer, setSelectedLanguage, setViewMode } = useApp();

  const [step, setStep] = useState<OnboardingStep>('welcome');

  // Customer Info Form
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [chosenLanguage, setChosenLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);

  // Face Enrollment
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  // Completed Account
  const [newAccount, setNewAccount] = useState<CustomerAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        stopCameraStream(cameraStreamRef.current);
      }
    };
  }, []);

  // Start Camera when entering Face Enroll step
  const handleStartCamera = async () => {
    setErrorMessage('');
    try {
      const stream = await requestCameraStream();
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      speakText('Please look straight at the camera to capture your face.', chosenLanguage.code);
    } catch (err) {
      console.warn('[Camera access error]:', err);
      setErrorMessage(
        'Unable to access camera. Please allow camera permissions in your browser to complete face enrollment.'
      );
    }
  };

  // Capture face descriptor from camera
  const handleCaptureFace = () => {
    if (!videoRef.current) return;
    const tempId = `user_${Date.now()}`;
    const descriptor = extractFaceDescriptorFromVideo(videoRef.current, tempId);
    setFaceDescriptor(descriptor);
    setFaceCaptured(true);

    if (cameraStreamRef.current) {
      stopCameraStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);

    speakText('Face captured successfully.', chosenLanguage.code);
  };

  // Submit Registration to backend
  const handleCompleteEnrollment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const userId = `np_${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(100 + Math.random() * 900)}`;

    try {
      // 1. Register Account on Backend
      const regRes = await api.registerAccount({
        userId,
        fullName: fullName.trim(),
        address: address.trim() || 'Lagos, Nigeria',
        language: chosenLanguage.code,
        email: email.trim() || undefined,
      });

      let createdAccount: CustomerAccount;

      if (regRes.ok && regRes.data) {
        createdAccount = regRes.data;
      } else {
        // Fallback local account with demo card
        createdAccount = {
          id: userId,
          name: fullName.trim(),
          preferredLanguage: chosenLanguage.code,
          balance: 50000,
          cardNumber: `5060 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
          address: address.trim() || 'Lagos, Nigeria',
          email: email.trim() || undefined,
        };
      }

      // 2. Register Face on Backend if descriptor captured
      if (faceDescriptor && faceDescriptor.length === 128) {
        await api.registerFace(createdAccount.id, faceDescriptor);
      }

      setNewAccount(createdAccount);
      setCurrentCustomer(createdAccount);
      setSelectedLanguage(chosenLanguage);
      setStep('ready');

      speakText(
        `Welcome to NativePay, ${createdAccount.name}. Your account is ready with ₦50,000 demo balance.`,
        chosenLanguage.code
      );
    } catch (err) {
      console.warn('[Registration notice]:', err);
      // Fallback local account
      const fallbackAccount: CustomerAccount = {
        id: userId,
        name: fullName.trim(),
        preferredLanguage: chosenLanguage.code,
        balance: 50000,
        cardNumber: `5060 0192 8472 ${Math.floor(1000 + Math.random() * 9000)}`,
        address: address.trim() || 'Lagos, Nigeria',
      };
      setNewAccount(fallbackAccount);
      setCurrentCustomer(fallbackAccount);
      setSelectedLanguage(chosenLanguage);
      setStep('ready');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-14">
      {/* Top back & progress indicator */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            if (step === 'welcome') setViewMode('landing');
            else if (step === 'info') setStep('welcome');
            else if (step === 'language') setStep('info');
            else if (step === 'face_enroll') setStep('language');
            else if (step === 'ready') setViewMode('customer-home');
          }}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {step === 'welcome' && 'Step 1 of 5'}
          {step === 'info' && 'Step 2 of 5'}
          {step === 'language' && 'Step 3 of 5'}
          {step === 'face_enroll' && 'Step 4 of 5'}
          {step === 'ready' && 'Ready!'}
        </span>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl">
        {/* STEP 1: Welcome */}
        {step === 'welcome' && (
          <div className="text-center py-4">
            <div className="w-18 h-18 rounded-3xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/25">
              <UserPlus className="w-9 h-9" />
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Welcome to NativePay
            </h1>
            <p className="text-slate-600 text-base max-w-md mx-auto mb-8 leading-relaxed">
              We make banking effortless by using your voice and face. In just 2 minutes, you will have a
              fully active account without passwords to remember.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">Bank using spoken local languages</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">Instant biometric face confirmation</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">₦50,000 demo opening balance included</span>
              </div>
            </div>

            <button
              onClick={() => setStep('info')}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2: Customer Information */}
        {step === 'info' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Customer Information</h2>
              <p className="text-slate-500 text-sm mt-1">Please enter your basic information.</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Amina Bello or Chidi Okafor"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Home or Business Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Market Road, Onitsha"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. amina@example.com"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!fullName.trim()) {
                  setErrorMessage('Please enter your full name to proceed.');
                  return;
                }
                setErrorMessage('');
                setStep('language');
              }}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Continue to Language</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {errorMessage && (
              <p className="text-rose-600 text-xs text-center mt-3 font-semibold">{errorMessage}</p>
            )}
          </div>
        )}

        {/* STEP 3: Language Preference */}
        {step === 'language' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Choose Your Language</h2>
              <p className="text-slate-500 text-sm mt-1">
                NativePay will speak to you and listen to you in this language.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setChosenLanguage(lang)}
                  className={`w-full p-4.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    chosenLanguage.code === lang.code
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-base">{lang.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lang.nativeLabel} • «{lang.greeting}»</div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      chosenLanguage.code === lang.code
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {chosenLanguage.code === lang.code && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setStep('face_enroll');
                setTimeout(() => handleStartCamera(), 400);
              }}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Continue to Face Enrollment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 4: Face Enrollment */}
        {step === 'face_enroll' && (
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Face Enrollment</h2>

            {/* Clear explanation of WHY face verification is collected */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-emerald-900 text-sm mb-6 text-left leading-relaxed">
              <p className="font-semibold mb-1">Why we collect face verification:</p>
              <p className="text-xs sm:text-sm text-emerald-800">
                Your face verification helps NativePay confirm that you are the person authorized to use this
                account without requiring complex passwords or secret PINs.
              </p>
            </div>

            {/* Camera View */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden bg-slate-900 border-4 border-emerald-500 shadow-xl mb-6">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {!isCameraActive && !faceCaptured && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-4">
                  <Camera className="w-10 h-10 mb-2 text-slate-500" />
                  <span className="text-xs text-center">Camera loading...</span>
                </div>
              )}

              {faceCaptured && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="font-bold text-sm">Face Captured!</span>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400 rounded-full m-6 pointer-events-none animate-pulse"></div>
              )}
            </div>

            {errorMessage && (
              <p className="text-rose-600 text-xs mb-4 font-semibold">{errorMessage}</p>
            )}

            {/* Controls */}
            {!faceCaptured ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleStartCamera}
                  className="w-full sm:w-1/2 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  Restart Camera
                </button>
                <button
                  onClick={handleCaptureFace}
                  className="w-full sm:w-1/2 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-colors shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Face</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleCompleteEnrollment}
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Account...</span>
                  ) : (
                    <>
                      <span>Complete Account Setup</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setFaceCaptured(false);
                    handleStartCamera();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Ready! */}
        {step === 'ready' && newAccount && (
          <div className="text-center py-4">
            <div className="w-18 h-18 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Your Account is Ready!
            </h1>
            <p className="text-slate-600 text-sm max-w-sm mx-auto mb-6">
              Welcome to NativePay, <span className="font-bold text-slate-900">{newAccount.name}</span>.
              You can now bank freely with your voice.
            </p>

            {/* Generated Card Showcase */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 text-left mb-8 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="font-extrabold text-lg text-emerald-400">NativePay</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/10 uppercase">
                  {chosenLanguage.label}
                </span>
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-slate-100 mb-6">
                {newAccount.cardNumber}
              </div>
              <div className="flex justify-between items-end text-xs text-slate-300">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase">Account Holder</span>
                  <span className="font-bold text-sm text-white">{newAccount.name}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400 uppercase">Opening Balance</span>
                  <span className="font-bold text-sm text-emerald-400">
                    ₦{newAccount.balance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewMode('customer-home')}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Go to My Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
