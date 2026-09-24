import React from 'react';
import { ShieldAlert, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0D1B2A] text-white pt-16 pb-12 border-t-3 border-[#0D1B2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4646] flex items-center justify-center text-white font-black font-display border-2 border-white shadow-[2px_2px_0px_#ffffff]">
                EP
              </div>
              <span className="font-black text-2xl font-display tracking-tight text-white">
                Elder<span className="text-[#FF4646]">Pay</span>
              </span>
            </div>

            <p className="text-sm text-gray-300 max-w-md leading-relaxed font-medium">
              Voice-first agent banking operating system for people the app-based banking model leaves out. Built for 40M+ elderly and low-literacy Nigerians through neighborhood POS agent stalls.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#0D1B2A] font-bold text-xs border-2 border-white shadow-[2px_2px_0px_#FF4646]">
              <ShieldAlert className="w-4 h-4 text-[#FF4646]" />
              <span>Hackathon Prototype & Demo Environment · 100% Mock Data</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-mono">
              Product & Views
            </h4>
            <ul className="space-y-2 text-gray-300 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-left"
                >
                  Landing Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/app')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-[#FF4646] font-bold text-left"
                >
                  Virtual POS Simulator (/app)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/pos')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-left"
                >
                  Agent Shift Console (/pos)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/onboarding')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-left"
                >
                  Customer Voice & Face Onboarding
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/history')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-left"
                >
                  Transaction Ledger (/history)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/architecture')}
                  className="hover:text-[#FF4646] transition-colors cursor-pointer text-left"
                >
                  Full-Stack Architecture Spec
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3 text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] font-mono">
              Languages & Dialects
            </h4>
            <ul className="space-y-1.5 text-gray-300 font-mono text-[11px]">
              <li>• Yorùbá (Èdè Yorùbá)</li>
              <li>• Hausa (Harshen Hausa)</li>
              <li>• Igbo (Asụsụ Igbo)</li>
              <li>• Nigerian Pidgin (Naija)</li>
              <li>• English (Nigerian Accent)</li>
            </ul>

            <div className="pt-2">
              <span className="text-[10px] text-gray-400 block font-mono">Core Belief:</span>
              <p className="text-xs text-[#FF4646] font-display font-bold italic">
                “Banking should understand you, not the other way around.”
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
          <p>
            Built for <strong className="text-white">Sahara Innovation Hackathon 2026</strong> · Prototype / Demo Environment.
          </p>
          <div className="flex items-center gap-4 text-gray-300 font-mono text-[11px]">
            <span>Client-Side Offline Sandbox</span>
            <span>•</span>
            <span>Idempotency-Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
