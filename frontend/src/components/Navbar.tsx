import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Store,
  History,
  Home,
  UserPlus,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp, SUPPORTED_LANGUAGES } from '../context/AppContext';
import { Language } from '../types';

export const Navbar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    selectedLanguage,
    setSelectedLanguage,
    backendHealth,
    currentCustomer,
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLang = (lang: Language) => {
    setSelectedLanguage(lang);
    setIsLangOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => setViewMode('landing')}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl p-1 -ml-1 transition-transform active:scale-95 cursor-pointer"
          aria-label="NativePay Home"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight">NP</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                NativePay
              </span>
              {backendHealth?.demoMode !== false && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Sandbox Demo
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs text-slate-500 font-medium tracking-tight">
              Banking that speaks to you
            </p>
          </div>
        </button>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Views Nav */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('customer-home')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'customer-home' || viewMode === 'customer-balance'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-600" />
              <span className="hidden xs:inline">Customer</span>
            </button>

            <button
              onClick={() => setViewMode('pos-agent')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pos-agent'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span className="hidden xs:inline">Agent POS</span>
            </button>

            <button
              onClick={() => setViewMode('customer-history')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'customer-history'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Transaction History"
            >
              <History className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">History</span>
            </button>

            <button
              onClick={() => setViewMode('onboarding')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'onboarding'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="New Customer Enrollment"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span className="hidden lg:inline">Enroll</span>
            </button>
          </nav>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Change language"
              aria-expanded={isLangOpen}
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">{selectedLanguage.label}</span>
              <span className="sm:hidden uppercase">{selectedLanguage.code}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLang(lang)}
                    className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      selectedLanguage.code === lang.code
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>{lang.label}</span>
                        {currentCustomer.preferredLanguage === lang.code && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                            Customer
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{lang.nativeLabel}</div>
                    </div>
                    {selectedLanguage.code === lang.code && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
