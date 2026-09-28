import React from 'react';
import { motion } from 'motion/react';
import { Mic, BrainCircuit, GitCommit, ScanFace, Layers, Store, History, Server } from 'lucide-react';

export const HackathonProof: React.FC = () => {
  const proofCards = [
    {
      title: 'Voice Pipeline',
      icon: Mic,
      tech: 'Acoustic Model + Dialect Audio',
      details: 'Processes raw 16kHz PCM audio buffers with background noise suppression tuned for busy Nigerian open-air markets.'
    },
    {
      title: 'Intent Extraction',
      icon: BrainCircuit,
      tech: 'FastAPI + Dialect Numeral Parser',
      details: 'Deterministically resolves numeral word-phrases (e.g., “ẹgbàárùn-ún náírà” → 10,000) and extracts recipient entities with fuzzy fallback.'
    },
    {
      title: 'State Machine',
      icon: GitCommit,
      tech: 'Deterministic Transition Engine',
      details: 'Strictly enforces lifecycle states (IDLE → LISTENING → UNDERSTOOD → VERIFYING → EXECUTING → SETTLED) with rollback protection.'
    },
    {
      title: 'Face Verification',
      icon: ScanFace,
      tech: 'Biometric Descriptor Matching',
      details: 'Compares normalized 128D facial vectors against locally enrolled customer templates with passive anti-spoofing heuristics.'
    },
    {
      title: 'Virtual Accounts',
      icon: Layers,
      tech: 'Tier-1/Tier-2 Account Layer',
      details: 'Maps elderly users to virtual NUBAN ledgers backed by regulated switches (Wema/NIP) without requiring smartphone app logins.'
    },
    {
      title: 'Agent Workflow',
      icon: Store,
      tech: 'Dual Confirmation Terminal',
      details: 'Both the customer’s verbal biometric consent and the registered POS agent terminal token are required to authorize fund debits.'
    },
    {
      title: 'Transaction History',
      icon: History,
      tech: 'Audited Local Ledger',
      details: 'Full search, filter, and receipt retrieval with cryptographic reference numbers (EP-2026-XXXXX) for dispute resolution.'
    },
    {
      title: 'API-Driven Core',
      icon: Server,
      tech: 'Stateless REST & WebSocket Backend',
      details: 'Modular endpoints ready for production microservices: /api/parse-voice, /api/verify-face, /api/execute-transfer, and /api/ledger.'
    }
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border-2 border-[#0D1B2A] shadow-[3px_3px_0px_#0D1B2A] text-[#0D1B2A] text-xs font-bold font-mono uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#FF4646] animate-ping" />
          <span>BUILT FOR THE REAL WORLD</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0D1B2A] font-display">
          Hackathon Engineering <span className="text-[#FF4646]">Proof</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          Concrete evidence of a functioning prototype designed for Sahara Innovation Hackathon judges.
        </p>
      </div>

      {/* 8 Proof Cards Grid in PayCart Neo-Brutalist Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {proofCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -4, x: -2 }}
              className="bg-white p-6 rounded-2xl border-2 border-[#0D1B2A] shadow-[4px_4px_0px_#0D1B2A] flex flex-col justify-between transition-all"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border-2 border-[#0D1B2A] shadow-[2px_2px_0px_#0D1B2A] flex items-center justify-center text-[#FF4646] mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#0D1B2A] font-display mb-1">
                  {c.title}
                </h3>
                <p className="text-[10px] font-mono text-[#0D8253] font-bold uppercase mb-2">
                  {c.tech}
                </p>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {c.details}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t-2 border-[#0D1B2A]/10 text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>STAGE #{idx + 1}</span>
                <span className="text-[#FF4646]">ACTIVE COMPONENT</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
