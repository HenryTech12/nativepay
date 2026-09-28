import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAccount, registerFace } from "../lib/api";
import { captureFaceDescriptor, loadFaceModels } from "../lib/faceAuth";
import { phrase, speak, prefetchSpeech, LANGUAGES } from "../lib/phrases";
import DeviceFrame from "../components/DeviceFrame";
import SpeakingIndicator from "../components/SpeakingIndicator";
import { useIsSpeaking } from "../lib/useIsSpeaking";

type Step = "start" | "name" | "email" | "address" | "face" | "review" | "done";

export default function Onboarding() {
  const navigate = useNavigate();
  const isSpeaking = useIsSpeaking();
  const [step, setStep] = useState<Step>("start");
  const [langIdx, setLangIdx] = useState(0);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lang = LANGUAGES[langIdx].code;

  useEffect(() => {
    // Fetch the "name" prompt's audio as soon as a language is picked on
    // the "start" step — by the time the user taps Continue and lands on
    // "name", it's already in hand instead of starting the network
    // round-trip only once that screen appears.
    if (step === "start") prefetchSpeech(phrase(lang, "askFullName"), lang);
  }, [step, lang]);

  useEffect(() => {
    if (step === "name") {
      speak(phrase(lang, "askFullName"), lang);
      prefetchSpeech(phrase(lang, "askEmail"), lang); // next step, fetched one step ahead
    }
    if (step === "email") {
      speak(phrase(lang, "askEmail"), lang);
      prefetchSpeech(phrase(lang, "askAddress"), lang);
    }
    if (step === "address") speak(phrase(lang, "askAddress"), lang);
  }, [step]);

  useEffect(() => {
    if (step === "face" && videoRef.current) {
      loadFaceModels().catch(() => {});
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(() => setStatus("Camera access is needed to register your face."));
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [step]);

  async function captureFace() {
    if (!videoRef.current) return;
    setStatus("Looking for your face...");
    const descriptor = await captureFaceDescriptor(videoRef.current);
    if (!descriptor) {
      setStatus("Couldn't find a face — look straight at the camera and try again.");
      return;
    }
    setFaceDescriptor(descriptor);
    setStatus("");
    setStep("review");
  }

  async function submit() {
    setSubmitError("");
    setStatus("Creating your account...");
    try {
      const account = await registerAccount({ userId, fullName, address, email, language: lang });
      setCardNumber(account.cardNumber || "");
      if (faceDescriptor) await registerFace(userId, faceDescriptor);
      await speak(phrase(lang, "enrollmentComplete"), lang);
      setStatus("");
      setStep("done");
    } catch (err) {
      setStatus("");
      const message = err instanceof Error ? err.message : "";
      setSubmitError(
        message === "ACCOUNT_EXISTS"
          ? "That phone number is already registered — try logging in instead, or use a different number."
          : message || "Couldn't reach the backend — check it's running and try again."
      );
    }
  }

  function onKeypadPress(key: string) {
    if (isSpeaking || step !== "start" || !/\d/.test(key)) return;
    setUserId((prev) => prev + key);
  }

  const titles: Record<Step, [string, string]> = {
    start: ["Onboard a customer", "Pick their language and a phone number to sign in with."],
    name: ["Customer's name", "Agent: enter the customer's full name — this becomes their account name."],
    email: ["Customer's email", "Agent: enter the customer's email address."],
    address: ["Customer's address", "Agent: enter the customer's home address."],
    face: ["Face verification", "Look at the camera so we can recognize you at transaction time."],
    review: ["Review", "Check the details before we onboard them."],
    done: ["You're in", "Head to the virtual POS to start using ElderPay."]
  };
  const [title, sub] = titles[step];

  return (
    <DeviceFrame onKeypadPress={onKeypadPress}>
      <div style={s.card}>
        <header style={s.header}>
          <div style={s.topRow}>
            <Link to="/" style={s.backLink}>← ElderPay</Link>
          </div>
          <h1 style={s.h1}>{title}</h1>
          <p style={s.sub}>{sub}</p>
        </header>

        <main style={s.main}>
          <SpeakingIndicator />
          {isSpeaking && <div style={s.speakingBlock} aria-hidden="true" />}
          {step === "start" && (
            <>
              <label style={s.label}>Phone number</label>
              <input style={s.input} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. 08012345678" />
              <div style={s.langRow}>
                {LANGUAGES.map((l, i) => (
                  <div className="clickable" key={l.code + i} style={{ ...s.langChip, ...(i === langIdx ? s.langChipActive : {}) }} onClick={() => setLangIdx(i)}>{l.label}</div>
                ))}
              </div>
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} disabled={!userId.trim()} onClick={() => setStep("name")}>Continue</button>
            </>
          )}

          {step === "name" && (
            <>
              <div style={s.hint}>{phrase(lang, "askFullName")}</div>
              <label style={s.label}>Full name</label>
              <input style={s.input} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Ngozi Adeyemi" autoFocus />
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} disabled={!fullName.trim()} onClick={() => setStep("email")}>Continue</button>
            </>
          )}

          {step === "email" && (
            <>
              <div style={s.hint}>{phrase(lang, "askEmail")} (optional — many customers won't have one)</div>
              <label style={s.label}>Email address (optional)</label>
              <input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. ngozi@example.com" autoFocus />
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} onClick={() => setStep("address")}>{email.trim() ? "Continue" : "Skip — no email"}</button>
            </>
          )}

          {step === "address" && (
            <>
              <div style={s.hint}>{phrase(lang, "askAddress")}</div>
              <label style={s.label}>Home address</label>
              <input style={s.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 12 Allen Avenue, Ikeja" autoFocus />
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} disabled={!address.trim()} onClick={() => setStep("face")}>Continue</button>
            </>
          )}

          {step === "face" && (
            <div style={s.micStage}>
              <video ref={videoRef} autoPlay playsInline muted style={s.video} />
              <div style={s.hint}>Look straight at the camera, then tap to capture.</div>
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} onClick={captureFace}>Capture my face</button>
              <div style={s.hint}>{status}</div>
            </div>
          )}

          {step === "review" && (
            <>
              <div style={s.reviewCard}>
                <Row label="Language" value={LANGUAGES[langIdx].label} />
                <Row label="Phone number" value={userId} />
                <Row label="Name" value={fullName} />
                <Row label="Email" value={email.trim() || "Not provided"} />
                <Row label="Address" value={address} />
                <Row label="Face" value={faceDescriptor ? "Captured ✓" : "Not captured"} />
              </div>
              <div style={s.mockNote}>Your face was captured just now as a numeric descriptor (not a photo) — this is what confirms it's you as the final check before a withdrawal or transfer goes through.</div>
              {submitError && <div style={s.errorCard}>{submitError}</div>}
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%", marginTop: 14 }} onClick={submit}>{status || "Onboard customer"}</button>
            </>
          )}

          {step === "done" && (
            <>
              <div style={s.reviewCard}>
                <div style={{ textAlign: "center", fontSize: 15, color: "var(--indigo)", fontWeight: 600, marginBottom: 10 }}>✓ {fullName}, your account is ready.</div>
                {cardNumber && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#8a8175", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your virtual card</div>
                    <div style={{ fontFamily: "monospace", fontSize: 17, color: "var(--charcoal)", letterSpacing: "0.05em" }}>{cardNumber}</div>
                  </div>
                )}
              </div>
              <div style={s.mockNote}>Insert this card number at the virtual POS to sign in — no need to remember your phone number.</div>
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%", marginTop: 14 }} onClick={() => navigate("/app")}>Go to virtual POS</button>
            </>
          )}
        </main>
      </div>
    </DeviceFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={s.reviewRow}>
      <span style={s.reviewLabel}>{label}</span>
      <span style={s.reviewValue}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line)" },
  header: { background: "linear-gradient(135deg, var(--indigo) 0%, var(--indigo-deep) 100%)", color: "var(--paper)", padding: "22px 26px 18px" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  backLink: { color: "var(--gold-light)", fontSize: 12, textDecoration: "none" },
  h1: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px" },
  sub: { margin: 0, fontSize: 12, color: "rgba(245,239,226,0.75)" },
  main: { padding: "24px 26px", minHeight: 340, display: "flex", flexDirection: "column", position: "relative" },
  speakingBlock: { position: "absolute", inset: 0, zIndex: 5, cursor: "not-allowed", background: "transparent" },
  label: { fontSize: 13, fontWeight: 600, color: "#5c5346", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 15, marginBottom: 14, transition: "border-color 160ms var(--ease-out)" },
  langRow: { display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" },
  langChip: { border: "1px solid var(--line)", background: "#fff", padding: "6px 11px", borderRadius: 100, fontSize: 12, fontWeight: 600 },
  langChipActive: { background: "var(--indigo)", color: "#fff", borderColor: "var(--indigo)" },
  linkText: { color: "var(--indigo)", fontWeight: 700, textDecoration: "underline", fontSize: 12 },
  micStage: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 14, padding: "4px 0" },
  hint: { fontSize: "12.5px", color: "#6b6357", textAlign: "center", maxWidth: 300, marginBottom: 8 },
  video: { width: 190, height: 190, borderRadius: "50%", objectFit: "cover", border: "4px solid var(--gold)", background: "var(--indigo-deep)", boxShadow: "var(--shadow-gold)" },
  btn: { padding: 13, borderRadius: 12, border: "none", fontWeight: 700, fontSize: "14.5px" },
  btnPrimary: { background: "linear-gradient(135deg, var(--indigo), var(--indigo-deep))", color: "#fff", boxShadow: "var(--shadow-sm)" },
  reviewCard: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, animation: "fadeInUp 320ms var(--ease-out)" },
  reviewRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed var(--line)" },
  reviewLabel: { color: "#8a8175" },
  reviewValue: { fontWeight: 600, color: "var(--charcoal)" },
  mockNote: { fontSize: "10.5px", color: "#a08a5f", background: "#fbf3e2", border: "1px dashed #d9b978", padding: "8px 10px", borderRadius: 8, textAlign: "center", marginTop: 14 },
  errorCard: { background: "#fdf1ef", border: "1px solid #f0c7be", borderRadius: 14, padding: 14, textAlign: "center", color: "var(--alert)", fontSize: 13, marginTop: 12 }
};
