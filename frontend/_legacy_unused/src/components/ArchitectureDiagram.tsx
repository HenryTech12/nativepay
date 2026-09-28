import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, ArrowRight, Server, Database, ShieldCheck, CreditCard, Terminal, Cpu } from 'lucide-react';
import { playChime } from '../lib/audio';

export const ArchitectureDiagram: React.FC = () => {
  const [expandedView, setExpandedView] = useState(false);

  const stages = [
    {
      step: '1',
      title: 'Frontend Client',
      sub: 'Vite / React 19 + POS',
      desc: 'Mobile & Terminal UI, audio capture, camera stream, local speech synthesis.',
      tech: 'Web Audio API + Canvas + motion'
    },
    {
      step: '2',
      title: 'FastAPI Gateway',
      sub: 'REST & WebSockets',
      desc: 'TLS 1.3 reverse proxy, rate-limiting, agent terminal JWT authentication.',
      tech: 'FastAPI / Pydantic V2 / Uvicorn'
    },
    {
      step: '3',
      title: 'Voice / AI Engine',
      sub: 'STT & Numeral Parser',
      desc: 'Processes Nigerian multi-lingual audio and extracts monetary entities.',
      tech: 'Whisper + Custom Dialect Lexicon'
    },
    {
      step: '4',
      title: 'Transaction Core',
      sub: 'State Machine & Rules',
      desc: 'Ensures strict state transitions, idempotency checks, and fee caps.',
      tech: 'Finite State Machine + Redis Locks'
    },
    {
      step: '5',
      title: 'Virtual Account',
      sub: 'Payment Abstraction',
      desc: 'Routes to partner bank switches (NIP / Paystack / Interswitch) or cash dispense.',
      tech: 'NUBAN Routing + Webhooks'
    },
    {
      step: '6',
      title: 'Audited Ledger',
      sub: 'Immutable Records',
      desc: 'Stores transaction references, voice verification hashes, and timestamps.',
      tech: 'SQL Ledger + Event Stream'
    }
  ];

  return (
    <section id="architecture" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>FULL-STACK TOPOLOGY</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Technical <span className="text-[#FF4646]">Architecture</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          From voice input at the physical agent stall to immutable interbank settlement.
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              playChime('click');
              setExpandedView(!expandedView);
            }}
            className="retro-btn-secondary px-5 py-2 text-xs font-extrabold cursor-pointer"
          >
            {expandedView ? 'Collapse Contract Details' : 'Inspect Technical API Contracts'}
          </button>
        </div>
      </div>

      {/* Architecture Chain in PayCart Neo-Brutalist Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative">
        {stages.map((s, idx) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -4, x: -2 }}
            className="bg-white p-5 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col justify-between transition-all relative"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-xl bg-[#0D1B2A] text-white flex items-center justify-center font-black text-xs font-mono border-2 border-[#0D1B2A] shadow-[1px_1px_0px_#FF4646]">
                  {s.step}
                </span>
                {idx < stages.length - 1 && (
                  <ArrowRight className="hidden lg:block w-4 h-4 text-gray-400 absolute -right-3.5 top-6 z-10 bg-white rounded-full border border-[#0D1B2A]" />
                )}
              </div>
              <h3 className="text-sm font-black text-[#0D1B2A] font-display mb-0.5">
                {s.title}
              </h3>
              <p className="text-[10px] font-mono text-[#FF4646] font-bold uppercase mb-2">
                {s.sub}
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                {s.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#0D1B2A]/10">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block font-bold">
                STACK
              </span>
              <span className="text-[10px] text-[#0D1B2A] font-mono font-bold block truncate">
                {s.tech}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded API Contracts View */}
      {expandedView && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-8 bg-[#0D1B2A] text-white p-6 sm:p-8 rounded-3xl border-3 border-[#0D1B2A] shadow-[6px_6px_0px_#FF4646] font-mono text-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b-2 border-white/15 text-white font-black">
            <span>FastAPI OpenAPI Schema Summary</span>
            <span className="text-[#FF4646] text-xs font-mono">REST v1.2</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1 font-bold">POST /api/v1/voice/interpret</p>
              <pre className="p-4 bg-[#091119] rounded-xl text-emerald-300 text-[11px] overflow-x-auto border border-white/10">
{`{
  "terminal_id": "EP-POS-LOS-402",
  "language": "yo",
  "audio_payload_b64": "<16khz_pcm_bytes>",
  "customer_id": "cust-1"
} -> 200 OK:
{
  "intent": "TRANSFER",
  "amount": 10000,
  "recipient": "Adewale Ogunleye",
  "confidence": 0.994
}`}
              </pre>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[10px] mb-1 font-bold">POST /api/v1/transactions/execute</p>
              <pre className="p-4 bg-[#091119] rounded-xl text-emerald-300 text-[11px] overflow-x-auto border border-white/10">
{`{
  "idempotency_key": "sha256:d8a4f9...",
  "terminal_id": "EP-POS-LOS-402",
  "amount": 10000,
  "recipient_account": "0129482711",
  "face_descriptor": [0.042, -0.129, ...],
  "customer_confirmed": true
} -> 200 OK:
{
  "reference": "EP-2026-92841",
  "status": "SETTLED",
  "new_balance": 15400
}`}
              </pre>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};
