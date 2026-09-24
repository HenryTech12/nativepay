import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, Volume2, VolumeX, Sparkles, Globe, Terminal, History, UserPlus } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGES } from '../lib/phrases';

export interface NavbarProps {
  activeRoute?: string;
  currentRoute?: string;
  onNavigate: (route: string) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  selectedLanguage?: Language;
  onSelectLanguage?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  currentRoute,
  onNavigate,
  soundEnabled = true,
  onToggleSound,
  selectedLanguage = 'yo',
  onSelectLanguage
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const route = activeRoute || currentRoute || '/';

  const navLinks = [
    { label: 'How It Works', path: '#how-it-works', isAnchor: true },
    { label: 'Virtual POS', path: '/app', isAnchor: false },
    { label: 'Agent Stall', path: '/pos', isAnchor: false },
    { label: 'Onboard', path: '/onboarding', isAnchor: false },
    { label: 'Ledger', path: '/history', isAnchor: false },
    { label: 'Architecture', path: '/architecture', isAnchor: false }
  ];

  const handleLinkClick = (item: { label: string; path: string; isAnchor: boolean }) => {
    setMobileMenuOpen(false);
    setLangDropdownOpen(false);
    if (item.isAnchor) {
      if (route !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const el = document.querySelector(item.path);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.querySelector(item.path);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(item.path);
    }
  };

  return (
    <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-[#0D1B2A] text-white rounded-full sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-2.5 shadow-2xl border-2 border-white/10 pointer-events-auto flex items-center justify-between backdrop-blur-md">
        {/* Left: Brand Identity in PayCart Style */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#FF4646] flex items-center justify-center font-bold text-white shadow-[1px_1px_0px_#ffffff] text-sm group-hover:scale-105 transition-transform">
            <span className="font-display font-black">EP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight font-display text-white">
              Elder<span className="text-[#FF4646]">Pay</span>
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-[#FF4646]/20 text-[#FF4646] rounded-full border border-[#FF4646]/30">
              OS
            </span>
          </div>
        </button>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 text-[13px] font-semibold text-gray-300">
          {navLinks.map((item) => {
            const isActive = route === item.path;
            return (
              <button
                key={item.label}
                onClick={() => handleLinkClick(item)}
                className={`hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg ${
                  isActive ? 'text-[#FF4646] font-bold bg-white/5' : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Audio + Language + Launch POS */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Sound Toggle */}
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
              className="p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          {/* Language Selector Pill */}
          {onSelectLanguage && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-gray-200 border border-white/10 cursor-pointer font-medium"
              >
                <Globe className="w-3 h-3 text-[#FF4646]" />
                <span>{LANGUAGES[selectedLanguage]?.nativeName || 'Language'}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0D1B2A] border-2 border-white/15 rounded-xl shadow-2xl py-1 z-50 text-xs">
                  {Object.entries(LANGUAGES).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => {
                        onSelectLanguage(key as Language);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                        selectedLanguage === key ? 'text-[#FF4646] font-bold' : 'text-gray-300'
                      }`}
                    >
                      <span>{item.nativeName}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{key}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Primary PayCart-style Action Button */}
          <button
            onClick={() => onNavigate('/app')}
            className="bg-white hover:bg-neutral-100 text-[#0D1B2A] font-bold px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm shadow-[2px_2px_0px_#FF4646] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Launch POS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Hamburger button for Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-gray-300 hover:text-white md:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 max-w-5xl mx-auto bg-[#0D1B2A] text-white border-2 border-white/15 rounded-2xl p-4 shadow-2xl pointer-events-auto"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleLinkClick(item)}
                  className="text-left text-sm font-semibold py-2 px-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-[#FF4646] transition-colors"
                >
                  {item.label}
                </button>
              ))}

              {onSelectLanguage && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 pb-1">
                    Select Dialect
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    {Object.entries(LANGUAGES).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => {
                          onSelectLanguage(key as Language);
                          setMobileMenuOpen(false);
                        }}
                        className={`text-left text-xs py-1.5 px-2.5 rounded-lg ${
                          selectedLanguage === key
                            ? 'bg-[#FF4646] text-white font-bold'
                            : 'bg-white/5 text-gray-300'
                        }`}
                      >
                        {item.nativeName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/onboarding');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-white border border-white/20 rounded-xl"
                >
                  Customer Face Onboarding
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('/app');
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold bg-[#FF4646] text-white rounded-xl shadow-[2px_2px_0px_#ffffff] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Launch Virtual POS
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
