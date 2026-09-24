import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, FileAudio, Cpu, Database, ShieldAlert, CreditCard, Receipt, ArrowRight, Code } from 'lucide-react';
import { playChime } from '../lib/audio';

export const AIPipeline: React.FC = () => {
  const [activeNode, setActiveNode] = useState<number>(3); // default Entity Extraction

  const pipelineNodes = [
    {
      id: 0,
      title: 'VOICE',
      label: 'Analog Audio',
      icon: Mic,
      tech: 'WAV 16kHz PCM audio chunk captured via POS terminal mic',
      output: 'Raw Audio Stream (duration: 2.8s, snr: 24dB)'
    },
    {
      id: 1,
      title: 'STT Audio',
      label: 'Acoustic Model',
      icon: FileAudio,
      tech: 'Fine-tuned Whisper / YarnGPT dialect phonetics',
      output: '“Mo fẹ́ fi ẹgbàárùn-ún náírà ránṣẹ́ sí Adéwálé”'
    },
    {
      id: 2,
      title: 'Intent Class',
      label: 'NLU Intent Classifier',
      icon: Cpu,
      tech: 'FastAPI intent classifier with fallback confidence score',
      output: 'TRANSFER_FUNDS (confidence: 0.994)'
    },
    {
      id: 3,
      title: 'Dialect Parser',
      label: 'Entity Extraction',
      icon: Database,
      tech: 'Named entity recognizer mapping words to numbers & accounts',
      output: JSON.stringify({
        action: 'TRANSFER',
        amount_naira: 10000,
        amount_words: 'ẹgbàárùn-ún náírà',
        recipient_name: 'Adewale Ogunleye',
        matched_beneficiary: '0129482711'
      }, null, 2)
    },
    {
      id: 4,
      title: 'Rule Engine',
      label: 'State Machine & Caps',
      icon: Cpu,
      tech: 'Idempotency checks, daily limit validation, balance locks',
      output: 'VALIDATED: Sufficient balance (₦25,400 >= ₦10,000)'
    },
    {
      id: 5,
      title: 'Biometrics',
      label: 'Face Biometrics',
      icon: ShieldAlert,
      tech: 'Local face descriptor Euclidean distance (< 0.4 threshold)',
      output: 'VERIFIED: Adewale Ogunleye (match_score: 0.962)'
    },
    {
      id: 6,
      title: 'NIP Switch',
      label: 'Payment Provider',
      icon: CreditCard,
      tech: 'Virtual account settlement adapter / Paystack / NIP rails',
      output: 'SETTLED: Interbank credit dispatched to Wema Bank'
    },
    {
      id: 7,
      title: 'Receipt & Log',
      label: 'Audit Log & TTS',
      icon: Receipt,
      tech: 'Immutable audit ledger + voice synthesis readback',
      output: 'REF: EP-2026-92841, Status: COMPLETED, Audio Readback OK'
    }
  ];

  return (
    <section id="technology" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-[#0D1B2A] text-white rounded-3xl p-6 sm:p-12 border-3 border-[#0D1B2A] shadow-[8px_8px_0px_#FF4646] relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#0D1B2A] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#FF4646]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4646] animate-ping" />
            <span>ARCHITECTURE & AI PIPELINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white">
            Under the conversation is an <br />
            <span className="text-[#FF4646]">intelligent pipeline.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-300 font-medium">
            Built for technical hackathon evaluation: Explore each node of the real-time audio-to-settlement pipeline.
          </p>
        </div>

        {/* Flowchart Nodes */}
        <div className="relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {pipelineNodes.map((node) => {
              const Icon = node.icon;
              const isSelected = activeNode === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => {
                    playChime('click');
                    setActiveNode(node.id);
                  }}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                    isSelected
                      ? 'bg-[#FF4646] border-white text-white shadow-[4px_4px_0px_#ffffff] -translate-y-1'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        0{node.id + 1}
                      </span>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    </div>
                    <h4 className="text-xs font-black font-display leading-tight mb-1">
                      {node.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-medium line-clamp-2 leading-tight ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Node Deep-Dive Inspector Panel */}
          <div className="mt-8 bg-[#142436] p-6 sm:p-8 rounded-3xl border-2 border-white/20 shadow-[4px_4px_0px_#000000]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF4646] text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-[2px_2px_0px_#ffffff]">
                  0{pipelineNodes[activeNode].id + 1}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white font-display">
                    Stage: {pipelineNodes[activeNode].title}
                  </h3>
                  <p className="text-xs text-[#FF4646] font-mono font-bold uppercase">
                    {pipelineNodes[activeNode].label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">
                  Click any stage above to inspect its execution schema
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              <div className="md:col-span-5 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF4646] font-bold block mb-1">
                    UNDERLYING SYSTEM ARCHITECTURE
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {pipelineNodes[activeNode].tech}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                  <p className="font-bold text-white mb-1">Hackathon Architecture Merit:</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Decoupled and stateless pipeline allows asynchronous queueing on rural 2G/3G networks, fast response caching, and zero vendor lock-in.
                  </p>
                </div>
              </div>

              <div className="md:col-span-7">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>INSPECTED RUNTIME PAYLOAD</span>
                </span>
                <pre className="p-4 rounded-xl bg-[#091119] text-emerald-300 font-mono text-xs overflow-x-auto border border-white/10 leading-relaxed">
                  {pipelineNodes[activeNode].output}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
