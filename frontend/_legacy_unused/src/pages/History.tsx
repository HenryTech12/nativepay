import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listTransactions } from "../lib/api";
import DeviceFrame from "../components/DeviceFrame";
import type { TransactionRecord } from "../types";

function stateColor(state: string): string {
  if (state === "TRANSACTION_SUCCESS") return "#3D7A5C";
  if (["TRANSACTION_FAILED", "FACE_VERIFICATION_FAILED", "BMONI_API_ERROR", "INVALID_AMOUNT", "INSUFFICIENT_FUNDS", "UNKNOWN_RECIPIENT", "USER_CANCELLED"].includes(state)) return "#B23A2E";
  return "#C98A2C";
}

function actionLabel(action: string): string {
  return { send: "Sent", withdraw: "Withdrew", deposit: "Deposited", airtime: "Bought airtime", balance: "Balance check" }[action] || action;
}

export default function History() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") || "mama-aisha";
  const [txs, setTxs] = useState<TransactionRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listTransactions(userId)
      .then(setTxs)
      .catch(() => setError(true));
  }, [userId]);

  return (
    <DeviceFrame>
      <div style={s.card}>
        <header style={s.header}>
          <div style={s.topRow}>
            <Link to="/app" style={s.backLink}>← Back to app</Link>
          </div>
          <h1 style={s.h1}>Transaction history</h1>
        </header>

        <main style={s.main}>
          {error && <div style={s.hint}>Couldn't reach the ElderPay backend. Check it's running.</div>}
          {!error && txs === null && <div style={s.hint}>Loading...</div>}
          {txs && txs.length === 0 && <div style={s.hint}>No transactions yet — try the demo.</div>}

          {txs && txs.map((tx) => (
            <div key={tx.id} style={s.txRow} className="hover-card">
              <div>
                <div style={s.txTitle}>
                  {actionLabel(tx.action)}{tx.amount ? ` ₦${tx.amount.toLocaleString()}` : ""}{tx.recipient ? `${tx.action === "airtime" ? " for " : " to "}${tx.recipient}` : ""}
                </div>
                <div style={s.txMeta}>{tx.id} · {new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <span style={{ ...s.badge, background: stateColor(tx.state) }}>{tx.state.replace(/_/g, " ")}</span>
            </div>
          ))}
        </main>
      </div>
    </DeviceFrame>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line)" },
  header: { background: "linear-gradient(135deg, var(--indigo) 0%, var(--indigo-deep) 100%)", color: "var(--paper)", padding: "22px 26px 18px" },
  topRow: { marginBottom: 10 },
  backLink: { color: "var(--gold-light)", fontSize: 12, textDecoration: "none" },
  h1: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, margin: 0 },
  main: { padding: "24px 26px" },
  hint: { color: "#8a8175", fontSize: "13.5px", textAlign: "center", padding: "30px 0" },
  txRow: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  txTitle: { fontWeight: 600, fontSize: 14.5 },
  txMeta: { fontSize: 12, color: "#8a8175", marginTop: 2 },
  badge: { fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 100, color: "#fff", whiteSpace: "nowrap" }
};
