import { useIsSpeaking } from "../lib/useIsSpeaking";

/** Shows a small pulsing indicator whenever speak() is actively playing
 * audio — so users know to wait for the voice prompt rather than acting
 * (or wondering why the screen hasn't moved on yet) while it's in flight. */
export default function SpeakingIndicator() {
  const speaking = useIsSpeaking();
  if (!speaking) return null;
  return (
    <div style={s.wrap}>
      <span style={{ ...s.dot, animationDelay: "0ms" }} />
      <span style={{ ...s.dot, animationDelay: "150ms" }} />
      <span style={{ ...s.dot, animationDelay: "300ms" }} />
      <span style={s.label}>Speaking...</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "6px 0" },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", display: "inline-block", animation: "speakingPulse 900ms ease-in-out infinite" },
  label: { fontSize: 11, color: "#8a8175", marginLeft: 4, fontWeight: 600, letterSpacing: "0.02em" }
};
