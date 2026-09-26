import React from 'react';
import { ShieldCheck, Heart, Volume2, Accessibility } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setViewMode, backendHealth } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 border-t border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand & Purpose */}
        <div className="text-center md:text-left max-w-sm">
          <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              NP
            </div>
            <span className="text-white font-bold text-lg tracking-tight">NativePay</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            «Banking that speaks to you.» Designed to remove barriers to digital financial services
            through voice, local languages and biometric verification.
          </p>
        </div>

        {/* Accessibility & Safety Notes */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-emerald-400" />
            <span>Inclusive Design</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>5 Local Languages</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Biometric Protection</span>
          </div>
        </div>

        {/* Quick Nav & Mode */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
          <button
            onClick={() => setViewMode('landing')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => setViewMode('customer-home')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Customer
          </button>
          <button
            onClick={() => setViewMode('pos-agent')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Agent POS
          </button>
          <button
            onClick={() => setViewMode('onboarding')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Enroll
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 NativePay. Built for financial inclusion and digital accessibility.</p>
        <p className="flex items-center gap-1.5">
          {backendHealth?.demoMode ? (
            <span className="text-amber-400">● Demo / Sandbox Ledger Active</span>
          ) : (
            <span className="text-emerald-400">● Live Backend Connected</span>
          )}
        </p>
      </div>
    </footer>
  );
};
