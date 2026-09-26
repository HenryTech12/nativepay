import React, { useState } from 'react';
import {
  Mic,
  Play,
  ShieldCheck,
  Globe,
  Store,
  CheckCircle2,
  Eye,
  HeartHandshake,
  ArrowRight,
  Volume2,
  CreditCard,
  UserCheck,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DemoVideoModal } from '../components/DemoVideoModal';

export const LandingPage: React.FC = () => {
  const { setViewMode, selectedLanguage, openVoiceModal } = useApp();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-full">
      {/* ==================================================
          1. TOP OF THE PAGE — ABOVE THE FOLD HERO
          Immediate access to [ Watch Demo ] and [ Try NativePay ]
      ================================================== */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 bg-radial-[at_top_center] from-emerald-50 via-white to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          {/* Subtle Brand Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200/60 mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            NATIVEPAY
          </div>

          {/* Core Tagline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            Banking that speaks to you.
          </h1>

          {/* Short Supporting Statement */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal">
            Financial services shouldn't be difficult to access simply because someone isn't comfortable
            with a smartphone, complex interfaces, or traditional digital banking.
          </p>

          {/* TWO PROMINENT ABOVE-THE-FOLD CTAS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            {/* Highly Visible [ Watch Demo ] Button */}
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-7 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 text-base sm:text-lg cursor-pointer active:scale-98"
              aria-label="Watch NativePay Demo"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>

            {/* Secondary CTA [ Try NativePay → ] */}
            <button
              onClick={() => setViewMode('customer-home')}
              className="w-full sm:w-auto px-7 py-4.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-300 transition-all shadow-xs flex items-center justify-center gap-2 text-base sm:text-lg cursor-pointer active:scale-98"
            >
              <span>Try NativePay</span>
              <ArrowRight className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. THE PROBLEM SECTION
          "Digital banking isn't accessible to everyone."
      ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
              The Accessibility Gap
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Digital banking isn't accessible to everyone.
            </h2>
            <p className="text-slate-700 text-base sm:text-lg mt-4 leading-relaxed font-normal">
              Having a bank account doesn't always mean having easy access to digital financial services.
            </p>
            <p className="text-slate-600 text-base sm:text-lg mt-2 leading-relaxed">
              Many people still face barriers because conventional banking experiences assume that everyone can
              confidently use a smartphone, navigate complex interfaces, remember authentication credentials, or
              communicate comfortably in a supported language.
            </p>
          </div>

          {/* Who Faces These Barriers */}
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              These barriers can affect:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: '👵',
                title: 'Older adults',
                desc: 'People who find small screens, confusing menus, and forgotten passwords frustrating or exclusionary.',
              },
              {
                icon: '♿',
                title: 'People with disabilities',
                desc: 'Individuals who require voice-first assistance and spoken confirmation to manage their funds with independence.',
              },
              {
                icon: '📖',
                title: 'People with limited literacy',
                desc: 'Citizens who speak fluently and understand money, but struggle with text-dense financial apps.',
              },
              {
                icon: '📱',
                title: 'People with limited digital literacy',
                desc: 'Everyday market traders and consumers who prefer conversational human interactions over complex app hierarchies.',
              },
              {
                icon: '🗣️',
                title: 'People who prefer local languages',
                desc: 'Speakers who communicate most comfortably in Nigerian Pidgin, Yorùbá, Hausa, or Igbo.',
              },
              {
                icon: '🌍',
                title: 'Others who face barriers',
                desc: 'Any person who has felt dependent on third parties or strangers to access their own money.',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-4 text-left"
              >
                <span className="text-2xl select-none shrink-0" role="img" aria-label={card.title}>
                  {card.icon}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">{card.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          3. THE STORY
          "One story that inspired NativePay"
      ================================================== */}
      <section className="bg-slate-900 text-white py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/80 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Shared experience
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              One story that inspired NativePay
            </h2>
            <p className="text-lg sm:text-xl text-slate-400 font-medium mt-1">
              A simple story. A bigger problem.
            </p>
          </div>

          {/* Narrative & Visual ₦350,000 Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Story Text */}
            <div className="lg:col-span-7 space-y-5 text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              <p className="text-slate-100 text-lg sm:text-xl font-medium leading-relaxed">
                A friend once shared how his grandmother lost <span className="font-extrabold text-emerald-400">₦350,000</span> while trying to receive money.
              </p>
              <p>
                She relied on a POS agent because she wasn't comfortable using digital banking herself. The money was sent to the agent's account on her behalf, but after the transfer, the agent claimed the money had not arrived.
              </p>
              <p className="border-l-2 border-emerald-500/60 pl-4 text-slate-200 italic">
                She was left dependent on someone else to access her own money.
              </p>
              <p className="text-white font-bold text-lg sm:text-xl pt-1">
                That shouldn't be necessary.
              </p>
            </div>

            {/* Right: Visual ₦350,000 Card (stacks on mobile) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800/90 rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  A story that inspired NativePay
                </span>

                <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-emerald-400 tracking-tight my-3">
                  ₦350,000
                </div>

                <div className="w-12 h-1 bg-emerald-500/40 mx-auto my-5 rounded-full"></div>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xs mx-auto font-medium">
                  One person's experience can reveal a bigger problem.
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              4. IMPORTANT TRANSITION
          ================================================== */}
          <div className="mt-16 pt-12 border-t border-slate-800 text-center max-w-2xl mx-auto">
            <p className="text-xl sm:text-2xl font-bold text-slate-200 mb-2">
              People shouldn't have to depend on someone else just to access their own money.
            </p>
            <p className="text-emerald-400 text-lg sm:text-xl font-bold">
              That's where NativePay comes in.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. NATIVEPAY HERO & SOLUTION
          Preserved approved hero visual design
      ================================================== */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 bg-radial-[at_top_center] from-emerald-50 via-white to-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Voice-First Financial Accessibility Platform
          </div>

          {/* Hero Heading */}
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Banking that speaks to you.
          </h2>

          {/* Supporting Copy */}
          <p className="text-lg sm:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            NativePay makes digital financial services easier to access through voice, local languages,
            biometric verification and a simple agent-assisted experience.
          </p>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <button
              onClick={() => setViewMode('customer-home')}
              className="w-full sm:w-auto px-8 py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 text-lg cursor-pointer active:scale-98"
            >
              <span>Try NativePay</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('pos-agent')}
              className="w-full sm:w-auto px-8 py-4.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200 transition-all shadow-xs flex items-center justify-center gap-2.5 text-lg cursor-pointer"
            >
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Agent POS Terminal</span>
            </button>
          </div>

          {/* Live Micro-Demo Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-xl mx-auto text-left flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <Mic className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Natural Voice Command
              </span>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                «Send ₦5,000 to Ada»
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Zero typing needed. Understood in {selectedLanguage.label}.
              </p>
            </div>
            <button
              onClick={() => {
                setViewMode('customer-home');
                setTimeout(() => openVoiceModal(), 300);
              }}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
            >
              Try Voice Demo
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. WHAT NATIVEPAY CHANGES (HOW IT WORKS)
      ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700">
              The Interaction Model
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              What NativePay changes
            </h2>
            <p className="text-slate-600 text-base sm:text-lg mt-3 leading-relaxed mb-6">
              NativePay gives people a more direct way to interact with their financial services — through conversation, local languages and secure identity verification.
            </p>

            {/* Visual Flow Banner */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs sm:text-sm font-bold text-slate-700">
              <span className="text-emerald-700">SPEAK</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-700">UNDERSTAND</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-700">CONFIRM</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-700">VERIFY</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-700">TRANSACT</span>
              <span className="text-slate-300">→</span>
              <span className="text-emerald-700">DONE</span>
            </div>
          </div>

          {/* 6 Core Steps: Speak -> Understand -> Confirm -> Verify -> Transact -> Done */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {/* Step 1: SPEAK */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">SPEAK</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tell NativePay what you need in your own words and local language.
              </p>
            </div>

            {/* Step 2: UNDERSTAND */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">UNDERSTAND</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                NativePay interprets your request, identifying the amount and recipient accurately.
              </p>
            </div>

            {/* Step 3: CONFIRM */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">CONFIRM</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Review and confirm the transaction details before anything moves.
              </p>
            </div>

            {/* Step 4: VERIFY */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">VERIFY</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Confirm your identity with a secure camera glance — no passwords to forget.
              </p>
            </div>

            {/* Step 5: TRANSACT */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                5
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">TRANSACT</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                The transaction is processed securely through the account ledger.
              </p>
            </div>

            {/* Step 6: DONE */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
                6
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">DONE</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive clear spoken confirmation and a detailed printable receipt.
              </p>
            </div>
          </div>

          {/* Important Positioning Statement Callout */}
          <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl text-center max-w-3xl mx-auto relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-7 h-7" />
            </div>

            <blockquote className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug text-white mb-4">
              «The goal isn't to replace the agent.
              <br className="hidden sm:inline" /> It's to reduce the dependency that can leave customers without direct control of their money.»
            </blockquote>

            <p className="text-emerald-200 text-base sm:text-lg font-medium max-w-xl mx-auto">
              NativePay brings the financial interaction closer to the person who owns the account.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. FEATURES SECTION
      ================================================== */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700">
              Designed For Real Lives
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Features that empower every user
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">5 Local Languages</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Full conversational support for English, Nigerian Pidgin, Yorùbá, Hausa, and Igbo.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Passwordless Biometrics</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                No complex PINs or security questions to memorize. A simple, secure camera glance validates access.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">POS & Agent Assisted</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Seamless agent workflow where agency banking operators can assist customers safely without touching credentials.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Voice Confirmation</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Auditory confirmation speaks back details in understandable words so users are never uncertain about their money.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Zero Visual Clutter</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Large buttons, high-contrast text, and generous spacing designed specifically for low eye strain.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Double-Confirmation Guard</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Transactions are never executed immediately after speech recognition. Clear review always precedes action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          8. FINAL CALL TO ACTION
      ================================================== */}
      <section className="py-16 px-4 sm:px-6 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            Ready to experience voice-first banking?
          </h2>
          <p className="text-emerald-100 text-lg max-w-xl mx-auto mb-8 font-normal">
            Try the demo with our sample customer profile or enroll a brand-new customer with your own face.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-lg cursor-pointer text-base flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Demo</span>
            </button>
            <button
              onClick={() => setViewMode('customer-home')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-colors shadow-lg cursor-pointer text-base flex items-center justify-center gap-2"
            >
              <span>Try NativePay</span>
              <ArrowRight className="w-5 h-5 text-emerald-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Embedded Demo Video Modal */}
      <DemoVideoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};
