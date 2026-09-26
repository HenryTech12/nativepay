import React, { useEffect, useState } from 'react';
import { X, Play, Volume2, Mic, ArrowRight, Video, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ isOpen, onClose }) => {
  const { openVoiceModal, setViewMode } = useApp();
  const rawVideoUrl = (import.meta.env.VITE_DEMO_VIDEO_URL as string | undefined)?.trim() || '';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper to determine embed URL for YouTube / Vimeo or direct video
  const getEmbedUrl = (url: string): { type: 'iframe' | 'video'; src: string } => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}?autoplay=1` };
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return { type: 'iframe', src: `https://www.youtube.com/embed/${videoId}?autoplay=1` };
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return { type: 'iframe', src: `https://player.vimeo.com/video/${videoId}?autoplay=1` };
    }
    return { type: 'video', src: url };
  };

  const videoConfig = rawVideoUrl ? getEmbedUrl(rawVideoUrl) : null;

  const handleLaunchVoiceDemo = () => {
    onClose();
    setViewMode('customer-home');
    setTimeout(() => {
      openVoiceModal();
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-label="NativePay Product Demo"
      aria-modal="true"
    >
      <div className="bg-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs">
              NP
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">NativePay Product Demo</h3>
              <p className="text-xs text-slate-400">Voice-First Financial Accessibility Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Walkthrough Player Body */}
        <div className="p-4 sm:p-6 bg-slate-950">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            {videoConfig ? (
              videoConfig.type === 'iframe' ? (
                <iframe
                  src={videoConfig.src}
                  title="NativePay Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={videoConfig.src}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              /* Missing Video Graceful Fallback with Interactive Live Walkthrough */
              <div className="p-6 sm:p-10 text-center max-w-xl mx-auto flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                  <Play className="w-8 h-8 fill-emerald-400 ml-1" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 mb-3">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Demo video coming soon</span>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                  Try the Live Interactive Demo Right Now
                </h4>

                <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                  Experience NativePay's voice flow directly in your browser. Speak naturally in English,
                  Pidgin, Yorùbá, Hausa, or Igbo to transfer money, check balances, and verify with your face.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                  <button
                    onClick={handleLaunchVoiceDemo}
                    className="w-full sm:w-auto flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Launch Voice Demo</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setViewMode('pos-agent');
                    }}
                    className="w-full sm:w-auto py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl transition-colors text-sm cursor-pointer border border-slate-700"
                  >
                    View Agent POS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Summary */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Voice Recognition
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Biometric Face Match
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              5 Nigerian Languages
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-semibold cursor-pointer underline"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
