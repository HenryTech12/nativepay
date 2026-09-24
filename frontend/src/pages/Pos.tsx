import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTransaction, getHealth, getAgentBmoniStatus } from "../lib/api";
import DeviceFrame from "../components/DeviceFrame";
import type { TransactionRecord, HealthStatus, AgentBmoniProfile } from "../types";

function stateClass(state: string): "ok" | "err" | "pending" {
  if (state === "TRANSACTION_SUCCESS") return "ok";
  if (["TRANSACTION_FAILED", "FACE_VERIFICATION_FAILED", "BMONI_API_ERROR", "INVALID_AMOUNT", "INSUFFICIENT_FUNDS", "UNKNOWN_RECIPIENT", "USER_CANCELLED"].includes(state)) return "err";
  return "pending";
}

const badgeColors = { ok: "#3D7A5C", err: "#B23A2E", pending: "#C98A2C" };

function actionTitle(action: string): string {
  switch (action) {
    case "send": return "Send money";
    case "withdraw": return "Withdraw cash";
    case "deposit": return "Deposit cash";
    case "airtime": return "Buy airtime";
    case "balance": return "Balance check";
    default: return "Transaction";
  }
}

function truncateMiddle(value: string, keep = 6): string {
  if (value.length <= keep * 2 + 3) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

export default function Pos() {
  const [txId, setTxId] = useState("");
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [bmoni, setBmoni] = useState<AgentBmoniProfile | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    Promise.all([getHealth(), getAgentBmoniStatus()])
      .then(([h, b]) => { setHealth(h); setBmoni(b); })
      .catch(() => setStatusError(true));
  }, []);

  async function lookup() {
    setNotFound(false);
    setTx(null);
    if (!txId.trim()) return;
    try {
      const result = await getTransaction(txId.trim());
      setTx(result);
    } catch {
      setNotFound(true);
    }
  }

  return (
    <DeviceFrame onKeypadPress={(k) => /\d/.test(k) && setTxId((prev) => prev + k)}>
      <div style={s.card}>
        <header style={s.header}>
          <div style={s.topRow}>
            <Link to="/" style={s.backLink}>← ElderPay</Link>
          </div>
          <h1 style={s.h1}>POS Agent View</h1>
          <p style={s.sub}>Track a customer's transaction status here. The agent never sees the customer's transcript, biometric data, or account credentials — only status.</p>
        </header>

        <main style={s.main}>
          <div style={s.sectionLabel}>Agent BMONI status</div>
          {statusError && <div style={s.hint}>Couldn't reach the backend — check it's running.</div>}
          {!statusError && !health && <div style={s.hint}>Loading...</div>}
          {health && (
            <>
              <Card label="BMONI mode">
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, color: "#fff", background: health.bmoniMockMode ? "#C98A2C" : "#3D7A5C" }}>
                  {health.bmoniMockMode ? "Sandbox-mock" : "Live sandbox"}
                </span>
              </Card>
              <Card label="Account/face storage">
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, color: "#fff", background: health.dbConnected ? "#3D7A5C" : "#C98A2C" }}>
                  {health.dbConnected ? "Postgres (persistent)" : "In-memory (lost on restart)"}
                </span>
              </Card>
            </>
          )}
          {bmoni && (
            <>
              <Card label="Agent onboarded">{bmoni.bmoniOnboarded ? "✓ Yes" : "Not yet"}</Card>
              {bmoni.bmoniOnboarded && (
                <>
                  <Card label="BMONI user ID"><span style={s.mono}>{truncateMiddle(bmoni.bmoniUserId || "—")}</span></Card>
                  <Card label="Smart wallet ID"><span style={s.mono}>{truncateMiddle(bmoni.bmoniSmartWalletId || "—")}</span></Card>
                  <Card label="Wallet address"><span style={s.mono}>{truncateMiddle(bmoni.bmoniWalletAddress || "—", 8)}</span></Card>
                  <Card label="Withdrawal account linked">{bmoni.bmoniWithdrawalAccountId ? "✓ Linked" : "Not linked"}</Card>
                </>
              )}
            </>
          )}

          <div style={{ ...s.sectionLabel, marginTop: 24 }}>Look up a transaction</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder="Transaction ID (e.g. EP-2026-123456)"
              style={s.input}
            />
            <button onClick={lookup} style={{ ...s.btn, ...s.btnPrimary }}>Look up</button>
          </div>

          {notFound && <div style={s.hint}>No transaction found — check the ID, or the backend may not be reachable.</div>}

          {tx && (
            <>
              <Card label="Status">
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, color: "#fff", background: badgeColors[stateClass(tx.state)] }}>
                  {tx.state.replace(/_/g, " ")}
                </span>
              </Card>
              <Card label="Type">{actionTitle(tx.action)}</Card>
              <Card label="Amount">{tx.amount ? `₦${tx.amount.toLocaleString()}` : "—"}</Card>
              <Card label="Face verification">{tx.faceVerified ? "✓ Verified" : "Not yet verified"}</Card>
              <Card label="Started">{new Date(tx.createdAt).toLocaleString()}</Card>
            </>
          )}

          <div style={s.mockNote}>Demo/sandbox mode. This view is read-only status — it facilitates the session, it does not control the customer's account.</div>
        </main>
      </div>
    </DeviceFrame>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.cardRow} className="hover-card">
      <div style={s.cardLabel}>{label}</div>
      <div style={s.cardValue}>{children}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line)" },
  header: { background: "linear-gradient(135deg, var(--indigo) 0%, var(--indigo-deep) 100%)", color: "var(--paper)", padding: "22px 26px 18px" },
  topRow: { marginBottom: 10 },
  backLink: { color: "var(--gold-light)", fontSize: 12, textDecoration: "none" },
  h1: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px" },
  sub: { margin: 0, fontSize: 12, color: "rgba(245,239,226,0.75)" },
  main: { padding: "24px 26px" },
  sectionLabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a8175", marginBottom: 10 },
  input: { flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--line)", fontSize: 14 },
  btn: { padding: "12px 18px", borderRadius: 10, border: "none", fontWeight: 700 },
  btnPrimary: { background: "linear-gradient(135deg, var(--indigo), var(--indigo-deep))", color: "#fff", boxShadow: "var(--shadow-sm)" },
  hint: { color: "#8a8175", fontSize: "13.5px", textAlign: "center", padding: "30px 0" },
  cardRow: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, marginBottom: 14 },
  cardLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8a8175", marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: 600 },
  mono: { fontFamily: "monospace", fontSize: 13 },
  mockNote: { fontSize: "10.5px", color: "#a08a5f", background: "#fbf3e2", border: "1px dashed #d9b978", padding: "8px 12px", borderRadius: 8, marginTop: 20, textAlign: "center" }
};
