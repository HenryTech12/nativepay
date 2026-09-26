import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { CustomerHome } from './pages/CustomerHome';
import { BalanceView } from './pages/BalanceView';
import { TransactionHistoryView } from './pages/TransactionHistoryView';
import { PosAgentView } from './pages/PosAgentView';
import { OnboardingFlow } from './pages/OnboardingFlow';
import { Mic, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { viewMode, openVoiceModal, bannerMessage, clearBanner } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Banner / Toast message notification */}
      {bannerMessage && (
        <div
          className={`px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-3 relative transition-all z-50 ${
            bannerMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : bannerMessage.type === 'warning'
              ? 'bg-amber-500 text-white'
              : bannerMessage.type === 'success'
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          <span>{bannerMessage.message}</span>
          <button
            onClick={clearBanner}
            className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar />

      {/* Dynamic View Router */}
      <main className="flex-1">
        {viewMode === 'landing' && <LandingPage />}
        {viewMode === 'customer-home' && <CustomerHome />}
        {viewMode === 'customer-balance' && <BalanceView />}
        {viewMode === 'customer-history' && <TransactionHistoryView />}
        {viewMode === 'pos-agent' && <PosAgentView />}
        {viewMode === 'onboarding' && <OnboardingFlow />}
      </main>

      {/* Global Floating Quick-Voice Trigger Button (visible when not on landing or pos-agent) */}
      {viewMode !== 'landing' && viewMode !== 'pos-agent' && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={openVoiceModal}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-400/50"
            aria-label="Speak to NativePay"
            title="Speak to NativePay"
          >
            <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
