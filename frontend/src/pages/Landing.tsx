import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useCountUp } from "../lib/useCountUp";

const styles: Record<string, React.CSSProperties> = {
  page: { position: "relative", overflow: "hidden" },
  blobGold: { position: "fixed", top: "-10%", right: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,138,44,0.22) 0%, rgba(201,138,44,0) 70%)", filter: "blur(10px)", pointerEvents: "none", zIndex: 0, animation: "blobDrift 14s ease-in-out infinite" },
  blobIndigo: { position: "fixed", top: "30vh", left: "-12%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,42,82,0.14) 0%, rgba(30,42,82,0) 70%)", filter: "blur(10px)", pointerEvents: "none", zIndex: 0, animation: "blobDrift 18s ease-in-out infinite reverse" },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 6vw", position: "sticky", top: 0, background: "rgba(245,239,226,0.85)", backdropFilter: "blur(10px)", zIndex: 10, borderBottom: "1px solid var(--line)", boxShadow: "0 2px 16px rgba(36,31,26,0.04)" },
  logo: { fontFamily: "Fraunces, serif", fontWeight: 800, fontSize: 21, color: "var(--indigo)", display: "flex", alignItems: "center", gap: 8 },
  logoMark: { width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, var(--gold), var(--gold-light))", display: "inline-block" },
  navLinks: { display: "flex", alignItems: "center", gap: 18 },
  posLink: { fontSize: "13.5px", color: "var(--indigo)", textDecoration: "none", fontWeight: 600 },
  cta: { background: "var(--indigo)", color: "var(--paper)", padding: "10px 22px", borderRadius: 100, textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: "var(--shadow-sm)" },
  hero: { display: "flex", alignItems: "center", gap: 60, padding: "9vh 6vw 10vh", maxWidth: 1200, margin: "0 auto", flexWrap: "wrap", position: "relative", zIndex: 1 },
  heroText: { flex: 1, minWidth: 320 },
  eyebrow: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: "12.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)", marginBottom: 18, padding: "6px 14px", borderRadius: 100, background: "rgba(201,138,44,0.1)", border: "1px solid rgba(201,138,44,0.25)" },
  h1: { fontFamily: "Fraunces, serif", fontWeight: 800, fontSize: "clamp(36px, 5.2vw, 58px)", lineHeight: 1.06, color: "var(--indigo)", marginBottom: 20, letterSpacing: "-0.02em" },
  em: { fontStyle: "normal", color: "var(--gold)", position: "relative" },
  lede: { fontSize: 17.5, lineHeight: 1.65, color: "#4a4238", maxWidth: 480, marginBottom: 32 },
  heroCtas: { display: "flex", gap: 14, flexWrap: "wrap" },
  btnPrimary: { background: "linear-gradient(135deg, var(--gold), #b87c22)", color: "#fff", padding: "16px 30px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 15, boxShadow: "var(--shadow-gold)", display: "inline-flex", alignItems: "center", gap: 8 },
  btnSecondary: { background: "transparent", color: "var(--indigo)", padding: "16px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 15, border: "1.5px solid var(--indigo)" },
  heroDemo: { flex: 1, minWidth: 300, maxWidth: 360, background: "linear-gradient(165deg, var(--indigo) 0%, var(--indigo-deep) 100%)", borderRadius: 24, padding: 0, color: "var(--paper)", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-lg)", animation: "floatY 6s ease-in-out infinite" },
  heroDemoChrome: { display: "flex", alignItems: "center", gap: 6, padding: "14px 18px", borderBottom: "1px solid rgba(245,239,226,0.1)" },
  heroDemoDot: { width: 8, height: 8, borderRadius: "50%", background: "rgba(245,239,226,0.25)" },
  heroDemoLabel: { marginLeft: "auto", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(245,239,226,0.4)", fontWeight: 700 },
  heroDemoBody: { padding: 26 },
  phraseYo: { fontFamily: "Fraunces, serif", fontSize: 19, marginBottom: 6 },
  phraseEn: { fontSize: "13.5px", color: "rgba(245,239,226,.65)", marginBottom: 22 },
  demoReceipt: { background: "rgba(245,239,226,.08)", border: "1px solid rgba(245,239,226,.18)", borderRadius: 14, padding: 16, fontSize: "13.5px" },
  receiptRow: { display: "flex", justifyContent: "space-between", padding: "4px 0" },
  ok: { color: "var(--gold-light)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 },
  section: { padding: "6vh 6vw 10vh", maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 },
  sectionAlt: { padding: "8vh 6vw", background: "linear-gradient(165deg, var(--indigo-deep) 0%, #0d1226 100%)", position: "relative", zIndex: 1 },
  sectionAltInner: { maxWidth: 1200, margin: "0 auto" },
  sectionHead: { maxWidth: 560, marginBottom: 44 },
  h2: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 32, color: "var(--indigo)", marginBottom: 10 },
  h2Light: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 32, color: "var(--paper)", marginBottom: 10 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 22 },
  card: { background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 26 },
  cardIcon: { fontSize: 26, marginBottom: 14, display: "block" },
  cardNum: { fontFamily: "Fraunces, serif", fontSize: 12, color: "var(--gold)", fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em" },
  cardH3: { fontSize: 17, marginBottom: 8, color: "var(--indigo)", fontWeight: 700 },
  cardP: { fontSize: "13.5px", color: "#5c5346", lineHeight: 1.6 },
  problemGrid: { display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" },
  statBlock: { flex: "1 1 340px", minWidth: 300, display: "flex", gap: 24, flexWrap: "wrap" },
  stat: { flex: "1 1 140px" },
  statNum: { fontFamily: "Fraunces, serif", fontSize: 44, fontWeight: 800, color: "var(--gold)", lineHeight: 1 },
  statLabel: { fontSize: "12.5px", color: "#4a4238", marginTop: 8, lineHeight: 1.4 },
  statSource: { fontSize: 11, color: "#8a8175", marginTop: 4 },
  personaBlock: { flex: "1 1 340px", minWidth: 300, background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 28, position: "relative" },
  personaQuoteMark: { position: "absolute", top: 12, left: 18, fontFamily: "Fraunces, serif", fontSize: 48, color: "rgba(201,138,44,0.18)", lineHeight: 1 },
  personaQuote: { fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 16.5, color: "var(--indigo)", lineHeight: 1.55, marginBottom: 12, position: "relative" },
  personaAttr: { fontSize: 12, color: "#8a8175" },
  trustGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginTop: 30 },
  trustCard: { background: "rgba(245,239,226,0.06)", border: "1px solid rgba(245,239,226,0.15)", borderRadius: 14, padding: 22 },
  trustIcon: { fontSize: 22, marginBottom: 10, display: "block" },
  trustH3: { fontSize: 14.5, color: "var(--gold-light)", fontWeight: 700, marginBottom: 6 },
  trustP: { fontSize: 13, color: "rgba(245,239,226,0.75)", lineHeight: 1.5 },
  honestyNote: { marginTop: 30, fontSize: 12.5, color: "rgba(245,239,226,0.55)", lineHeight: 1.6, maxWidth: 720 },
  footer: { padding: "5vh 6vw", textAlign: "center", color: "#8a8175", fontSize: 13, borderTop: "1px solid var(--line)", position: "relative", zIndex: 1 },

  originWrap: { background: "#fff", border: "1px solid var(--line)", borderRadius: 20, padding: "40px 44px", boxShadow: "var(--shadow-md)", position: "relative", overflow: "hidden" },
  originQuoteMark: { position: "absolute", top: 8, left: 20, fontFamily: "Fraunces, serif", fontSize: 90, color: "rgba(201,138,44,0.1)", lineHeight: 1 },
  originQuote: { fontFamily: "Fraunces, serif", fontWeight: 700, fontStyle: "italic", fontSize: "clamp(20px, 2.6vw, 28px)", color: "var(--indigo)", lineHeight: 1.4, maxWidth: 780, position: "relative" },
  originSteps: { display: "flex", alignItems: "center", gap: 10, marginTop: 28, flexWrap: "wrap" },
  originStep: { flex: "1 1 140px", minWidth: 120, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--indigo)", textAlign: "center" },
  originStepLast: { background: "var(--gold)", color: "#fff", border: "none" },
  originArrow: { color: "var(--gold)", fontSize: 18, flexShrink: 0 },

  statGridFull: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 26, marginTop: 36 },

  marketBars: { display: "flex", flexDirection: "column", gap: 18, marginTop: 8 },
  marketRow: { display: "flex", alignItems: "center", gap: 18 },
  marketLabel: { width: 56, fontSize: 13, fontWeight: 700, color: "var(--indigo)", flexShrink: 0 },
  marketTrack: { flex: 1, height: 46, borderRadius: 10, background: "rgba(30,42,82,0.06)", position: "relative", overflow: "hidden" },
  marketFill: { height: "100%", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 18px", transition: "width 900ms var(--ease-out)" },
  marketValue: { fontFamily: "Fraunces, serif", fontWeight: 800, fontSize: 20, color: "#fff" },
  marketNote: { fontSize: 12, color: "#8a8175", lineHeight: 1.6, marginTop: 18, maxWidth: 780 },

  impactChain: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 30 },
  impactBox: { flex: "1 1 160px", minWidth: 140, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 16px", textAlign: "center", fontWeight: 700, color: "var(--indigo)", fontSize: 14.5 },
  impactBoxLead: { background: "var(--indigo)", color: "#fff", border: "none" },
  impactArrow: { color: "var(--gold)", fontSize: 18, flexShrink: 0 },
  impactPills: { display: "flex", gap: 28, flexWrap: "wrap", marginTop: 30 },
  impactPill: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "var(--indigo)" },
  impactDot: { width: 12, height: 12, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }
};

const features = [
  { num: "01", icon: "🗣️", title: "Speak", body: "Say what you want in your own language. Groq's speech AI transcribes it in under a second." },
  { num: "02", icon: "🔊", title: "Confirm", body: "ElderPay reads the transaction back to you out loud before anything moves." },
  { num: "03", icon: "🪪", title: "Verify", body: "A real face check replaces PINs and passwords — nothing to remember, nothing to forget." },
  { num: "04", icon: "✅", title: "Done", body: "BMONI processes the transfer and ElderPay confirms it out loud, with a digital receipt." }
];

const trust = [
  { icon: "🎙️", title: "Groq · Whisper", body: "Real speech-to-text transcription and LLM intent parsing, tuned for Nigerian languages and Naira amounts." },
  { icon: "🔈", title: "YarnGPT", body: "Nigerian-accented text-to-speech for every confirmation, balance, and success message the system speaks." },
  { icon: "🏦", title: "Paystack", body: "Real Nigerian bank-account name-enquiry, used to verify unrecognized send recipients before any transfer." },
  { icon: "🔐", title: "BMONI", body: "Real sandbox wallet — created, KYC'd, and NGN-rail-activated — settling real withdrawals through a signed on-chain proposal." }
];

const extraStats = [
  { target: 2, prefix: "", suffix: " in 5", label: "Nigerian adults have low digital literacy", source: "EFInA Access to Financial Services Survey, 2023" },
  { target: 38, suffix: "%", label: "adult illiteracy rate nationwide", source: "EFInA Access to Financial Services Survey, 2023" },
  { target: 53.9, suffix: "%", label: "of Nigerians depend on POS agents for everyday transactions", source: "EFInA Access to Financial Services Survey, 2023" },
  { target: 25.85, prefix: "₦", suffix: "B", label: "lost to digital payment fraud", source: "NIBSS Digital Payment Fraud Report, 2025" }
];

const revenueStreams = [
  { icon: "💳", title: "Transaction fees", body: "A small fee on each send, withdrawal, or airtime top-up processed through BMONI." },
  { icon: "🤝", title: "Bank partnerships", body: "Licensed banks pay to reach previously unbanked and underserved customers through the same terminals they already trust." },
  { icon: "🖥️", title: "POS integrations", body: "Agent networks pay for a voice-and-face layer that lets their existing hardware serve customers apps can't." },
  { icon: "⭐", title: "Premium features", body: "Optional add-ons for banks and agents — analytics, priority support, multi-branch management." }
];

function MarketBar({ label, value, display, share }: { label: string; value: number; display: string; share: number }) {
  const { ref, value: animated } = useCountUp(share, 1400);
  return (
    <div style={styles.marketRow}>
      <div style={styles.marketLabel}>{label}</div>
      <div style={styles.marketTrack} ref={ref}>
        <div style={{ ...styles.marketFill, width: `${animated}%`, background: value === 100 ? "linear-gradient(90deg, rgba(30,42,82,0.35), var(--indigo))" : value >= 30 ? "linear-gradient(90deg, rgba(201,138,44,0.6), var(--gold))" : "linear-gradient(90deg, var(--gold), #b87c22)" }}>
          <span style={styles.marketValue}>{display}</span>
        </div>
      </div>
    </div>
  );
}

function StatNumber({ target, suffix, prefix }: { target: number; suffix?: string; prefix?: string }) {
  const { ref, value } = useCountUp(target);
  return <div ref={ref} style={styles.statNum}>{prefix}{value}{suffix}</div>;
}

export default function Landing() {
  return (
    <div style={styles.page}>
      <div style={styles.blobGold} aria-hidden="true" />
      <div style={styles.blobIndigo} aria-hidden="true" />

      <nav style={styles.nav}>
        <div style={styles.logo}><span style={styles.logoMark} />ElderPay</div>
        <div style={styles.navLinks}>
          <Link to="/pos" style={styles.posLink}>POS agent view</Link>
          <Link to="/onboarding" style={styles.posLink}>Onboard a customer</Link>
          <Link to="/app" style={styles.cta}>Try the demo</Link>
        </div>
      </nav>

      <div style={styles.hero}>
        <div style={styles.heroText}>
          <div style={styles.eyebrow}>✨ NITHUB Innovation Fair 2026 · AI + BMONI</div>
          <h1 style={styles.h1}>Banking that speaks <span style={styles.em}>your</span> language.</h1>
          <p style={styles.lede}>No apps to learn. No PINs to forget. Walk up to any participating POS agent, speak naturally in Yorùbá, Hausa, Igbo, or Pidgin, and ElderPay handles the rest — securely, through BMONI.</p>
          <div style={styles.heroCtas}>
            <Link to="/app" style={styles.btnPrimary}>Start speaking →</Link>
            <a href="#problem" style={styles.btnSecondary}>Why we built this</a>
            <a href="https://drive.google.com/file/d/1xGWe3um5fwWpAl-kErVQiFWtqs-FL1He/view?usp=drivesdk" target="_blank" rel="noopener noreferrer" style={styles.btnSecondary}>▶ Watch demo video</a>
          </div>
        </div>
        <div style={styles.heroDemo}>
          <div style={styles.heroDemoChrome}>
            <span style={styles.heroDemoDot} /><span style={styles.heroDemoDot} /><span style={styles.heroDemoDot} />
            <span style={styles.heroDemoLabel}>Live preview</span>
          </div>
          <div style={styles.heroDemoBody}>
            <div style={styles.phraseYo}>"Mo fẹ́ fi ẹgbẹ̀rún mẹ́wàá ránṣẹ́ sí ọmọ mi."</div>
            <div style={styles.phraseEn}>"I want to send ₦10,000 to my daughter."</div>
            <div style={styles.demoReceipt}>
              <div style={styles.receiptRow}><span>Amount</span><span>₦10,000</span></div>
              <div style={styles.receiptRow}><span>To</span><span>Adaeze</span></div>
              <div style={styles.receiptRow}><span>Status</span><span style={styles.ok}>✓ Sent</span></div>
            </div>
          </div>
        </div>
      </div>

      <section style={styles.section}>
        <Reveal>
          <div style={styles.originWrap}>
            <div style={styles.originQuoteMark}>"</div>
            <p style={styles.originQuote}>I built ElderPay because my grandmother lost ₦250,000 — not to a scam, but to confusion. She depended on a POS agent for every transaction, and one misunderstood instruction was all it took.</p>
            <div style={styles.originSteps}>
              <div style={styles.originStep}>POS dependency</div>
              <span style={styles.originArrow}>→</span>
              <div style={styles.originStep}>Confusion</div>
              <span style={styles.originArrow}>→</span>
              <div style={styles.originStep}>Loss</div>
              <span style={styles.originArrow}>→</span>
              <div style={{ ...styles.originStep, ...styles.originStepLast }}>ElderPay</div>
            </div>
          </div>
        </Reveal>
      </section>

      <section style={styles.section} id="problem">
        <Reveal>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>The problem isn't money. It's the interface.</h2>
            <p style={{ color: "#4a4238", fontSize: 15, lineHeight: 1.6 }}>Nigeria's digital banking push has left a specific group behind — and it's not because they can't afford an account.</p>
          </div>
        </Reveal>
        <div style={styles.problemGrid}>
          <Reveal delay={80} style={styles.statBlock}>
            <>
              <div style={styles.stat}>
                <StatNumber target={36} prefix="~" suffix="%" />
                <div style={styles.statLabel}>of Nigerian adults remain unbanked</div>
                <div style={styles.statSource}>World Bank, via Techpoint Africa</div>
              </div>
              <div style={styles.stat}>
                <StatNumber target={26} suffix="%" />
                <div style={styles.statLabel}>of Nigerians are financially excluded — down from 32% in 2020, but still tens of millions of people</div>
                <div style={styles.statSource}>EFInA Access to Finance survey, 2023</div>
              </div>
            </>
          </Reveal>
          <Reveal delay={160} style={styles.personaBlock}>
            <>
              <div style={styles.personaQuoteMark}>"</div>
              <div style={styles.personaQuote}>Most elderly adults studied never adopted internet banking — they simply returned to traditional, in-person banking.</div>
              <div style={styles.personaAttr}>Digital Inclusion and the Elderly: Internet Banking Use and Non-Use among Older Adults in Ekiti State, Nigeria — Covenant University Journal of Business and Social Sciences</div>
            </>
          </Reveal>
        </div>
        <div style={styles.statGridFull}>
          {extraStats.map((st, i) => (
            <Reveal delay={i * 80} key={st.label}>
              <div>
                <StatNumber target={st.target} prefix={st.prefix} suffix={st.suffix} />
                <div style={styles.statLabel}>{st.label}</div>
                <div style={styles.statSource}>{st.source}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={styles.section} id="features">
        <Reveal>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>How it works</h2>
            <p style={{ color: "#4a4238", fontSize: 15, lineHeight: 1.6 }}>Every step is designed for someone who has never used a banking app — and never needs to.</p>
          </div>
        </Reveal>
        <div style={styles.grid}>
          {features.map((f, i) => (
            <Reveal delay={i * 90} key={f.num}>
              <div style={styles.card} className="hover-card">
                <span style={styles.cardIcon}>{f.icon}</span>
                <div style={styles.cardNum}>STEP {f.num}</div>
                <h3 style={styles.cardH3}>{f.title}</h3>
                <p style={styles.cardP}>{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <Reveal>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>Market opportunity</h2>
            <p style={{ color: "#4a4238", fontSize: 15, lineHeight: 1.6 }}>Nigeria's mobile-connected adults, narrowed down to the ones ElderPay is actually built to reach first.</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div style={styles.marketBars}>
            <MarketBar label="TAM" value={100} display="100M+" share={100} />
            <MarketBar label="SAM" value={30} display="30M" share={55} />
            <MarketBar label="SOM" value={2} display="2M" share={22} />
          </div>
        </Reveal>
        <Reveal delay={140}>
          <p style={styles.marketNote}>Methodology: TAM = Nigerian adults with mobile phone access. SAM = Digitally underserved adults (financially excluded + low digital literacy). SOM = Initial users reachable through bank and agent partnerships. Source: EFInA 2023, NBS, NCC.</p>
        </Reveal>
      </section>

      <section style={styles.section} id="business-model">
        <Reveal>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>How ElderPay makes money</h2>
            <p style={{ color: "#4a4238", fontSize: 15, lineHeight: 1.6 }}>A sustainable business layered on top of infrastructure that already exists.</p>
          </div>
        </Reveal>
        <div style={styles.grid}>
          {revenueStreams.map((r, i) => (
            <Reveal delay={i * 90} key={r.title}>
              <div style={styles.card} className="hover-card">
                <span style={styles.cardIcon}>{r.icon}</span>
                <h3 style={styles.cardH3}>{r.title}</h3>
                <p style={styles.cardP}>{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div style={styles.sectionAlt}>
        <div style={styles.sectionAltInner}>
          <Reveal>
            <>
              <h2 style={styles.h2Light}>Built on real infrastructure, not a mockup</h2>
              <p style={{ color: "rgba(245,239,226,0.7)", fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>Every service below is a live integration — you can verify each one yourself from the POS agent view.</p>
            </>
          </Reveal>
          <div style={styles.trustGrid}>
            {trust.map((t, i) => (
              <Reveal delay={i * 90} key={t.title}>
                <div style={styles.trustCard} className="hover-card-dark">
                  <span style={styles.trustIcon}>{t.icon}</span>
                  <div style={styles.trustH3}>{t.title}</div>
                  <div style={styles.trustP}>{t.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p style={styles.honestyNote}>We're upfront about the rest, too: face verification is real for every account onboarded through the app (a live facial descriptor, captured and matched, never a stored photo) — it's only ever simulated as a disclosed fallback for the two seeded demo accounts that predate the feature. Every transaction records exactly which check verified it.</p>
          </Reveal>
        </div>
      </div>

      <section style={styles.section}>
        <Reveal>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>Financial inclusion through voice</h2>
            <p style={{ color: "#4a4238", fontSize: 15, lineHeight: 1.6 }}>Every party in the chain benefits, not just the customer at the center of it.</p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div style={styles.impactChain}>
            <div style={{ ...styles.impactBox, ...styles.impactBoxLead }}>Elderly</div>
            <span style={styles.impactArrow}>→</span>
            <div style={styles.impactBox}>POS Agents</div>
            <span style={styles.impactArrow}>→</span>
            <div style={styles.impactBox}>Banks</div>
            <span style={styles.impactArrow}>→</span>
            <div style={styles.impactBox}>Communities</div>
          </div>
        </Reveal>
        <Reveal delay={140}>
          <div style={styles.impactPills}>
            <div style={styles.impactPill}><span style={styles.impactDot} />More access</div>
            <div style={styles.impactPill}><span style={styles.impactDot} />Less fraud</div>
            <div style={styles.impactPill}><span style={styles.impactDot} />More independence</div>
          </div>
        </Reveal>
      </section>

      <footer style={styles.footer}>ElderPay — built for NITHUB Innovation Fair Hackathon 2026. Sandbox / test data only.</footer>
    </div>
  );
}
