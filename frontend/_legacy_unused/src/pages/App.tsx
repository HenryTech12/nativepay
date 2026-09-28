import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  voiceProcess, confirmCreate, confirmAdvance, cancelTransaction,
  verifyFace, sendTransaction, getReceipt, getBalance,
  getAccount,
  resolveRecipientByAccount, getBanks, searchAccountsByName,
  authorizeFace, getFaceStatus
} from "../lib/api";
import { recordAudio } from "../lib/audio";
import { captureFaceDescriptor, loadFaceModels } from "../lib/faceAuth";
import { phrase, speak, LANGUAGES } from "../lib/phrases";
import DeviceFrame from "../components/DeviceFrame";
import SpeakingIndicator from "../components/SpeakingIndicator";
import { useIsSpeaking } from "../lib/useIsSpeaking";
import type { TransactionRecord, Receipt, Action, Bank } from "../types";

type Step =
  | "card" | "faceAuth" | "authFailed"
  | "listen" | "confirm" | "clarify" | "error" | "face" | "processing" | "balance" | "receipt";

function looksLikePhoneNumber(query: string): boolean {
  const digitsOnly = query.replace(/[\s-]/g, "");
  return /^\d{6,}$/.test(digitsOnly);
}

function actionTitle(action: Action): string {
  switch (action) {
    case "send": return "Send money";
    case "withdraw": return "Withdraw cash";
    case "deposit": return "Deposit cash";
    case "airtime": return "Buy airtime";
    default: return "Transaction";
  }
}

function successTitle(action: Action): string {
  switch (action) {
    case "send": return "Transfer";
    case "withdraw": return "Withdrawal";
    case "deposit": return "Deposit";
    case "airtime": return "Airtime purchase";
    default: return "Transaction";
  }
}

function confirmPhraseFor(lang: string, action: Action, amount: number | null, recipient: string | null): string {
  switch (action) {
    case "send": return phrase(lang, "confirmSend", amount || 0, recipient || "");
    case "deposit": return phrase(lang, "confirmDeposit", amount || 0);
    case "airtime": return phrase(lang, "confirmAirtime", amount || 0, recipient || "");
    default: return phrase(lang, "confirmWithdraw", amount || 0);
  }
}

function successPhraseFor(lang: string, action: Action, amount: number | null, recipient: string | null): string {
  switch (action) {
    case "send": return phrase(lang, "successSend", amount || 0, recipient || "");
    case "deposit": return phrase(lang, "successDeposit", amount || 0);
    case "airtime": return phrase(lang, "successAirtime", amount || 0, recipient || "");
    default: return phrase(lang, "successWithdraw", amount || 0);
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_AMOUNT: "That amount doesn't look right. Please say an amount greater than zero.",
  INSUFFICIENT_FUNDS: "You don't have enough balance for that.",
  UNKNOWN_RECIPIENT: "I don't recognize that recipient. Try Adewale, Ngozi, or Ibrahim.",
  TRANSACTION_FAILED: "Your transaction could not be completed. No money was deducted.",
  FACE_VERIFICATION_FAILED: "We couldn't verify your identity. Please try again.",
  BMONI_API_ERROR: "We're having trouble reaching BMONI right now. No money was deducted.",
  NETWORK_ERROR: "We're having trouble connecting. Please check your connection and try again.",
  default: "Sorry, something went wrong. Please try again."
};

export default function App() {
  const isSpeaking = useIsSpeaking();
  const [step, setStep] = useState<Step>("card");
  const [userId, setUserId] = useState("");
  const [langIdx, setLangIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [tx, setTx] = useState<TransactionRecord | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<string>("default");

  const [inserting, setInserting] = useState(false);
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [accountNumberError, setAccountNumberError] = useState("");
  const [accountNumberBusy, setAccountNumberBusy] = useState(false);

  const [loginQuery, setLoginQuery] = useState("");
  const [loginError, setLoginError] = useState("");
  const [nameMatches, setNameMatches] = useState<{ id: string; name: string }[] | null>(null);

  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceStatus, setFaceStatus] = useState("");

  const recorderRef = useRef<{ stop: () => void; result: Promise<Blob> } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (step === "clarify" && tx?.needsClarification === "accountNumber" && banks.length === 0) {
      getBanks().then(setBanks).catch(() => {});
    }
  }, [step, tx?.needsClarification]);

  useEffect(() => {
    if (step === "face" || step === "faceAuth") {
      setFaceStatus("");
      loadFaceModels().catch(() => {});
      getFaceStatus(userId).then((s) => setFaceRegistered(s.registered)).catch(() => setFaceRegistered(false));
      if (videoRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then((stream) => { if (videoRef.current) videoRef.current.srcObject = stream; })
          .catch(() => setFaceStatus("Camera access is needed for face verification."));
      }
    }
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [step]);

  function resetAll() {
    setTx(null); setReceipt(null); setTranscript(""); setBalance(null);
    setAccountNumberInput(""); setAccountNumberError(""); setBankCode("");
    setStep("listen");
  }

  function startSession(forUserId: string) {
    setUserId(forUserId);
    setStep("faceAuth");
  }

  /** Shared by every way into the app — resolves the account's saved
   * language and starts the session. */
  function proceedWithAccount(accountId: string, preferredLanguage: string) {
    const idx = LANGUAGES.findIndex((l) => l.code === preferredLanguage);
    if (idx >= 0) setLangIdx(idx);
    startSession(accountId);
  }

  /** Once a customer is onboarded, their card being plugged into the POS
   * is just the physical gesture — the actual lookup only needs their
   * name or phone number, since a 16-digit card number isn't something
   * most elderly customers can reliably recall or read back. */
  async function onSubmitLogin() {
    const query = loginQuery.trim();
    if (!query) return;
    setLoginError("");
    setNameMatches(null);
    setInserting(true);
    await new Promise((resolve) => setTimeout(resolve, 550)); // let the card-insert animation play out
    try {
      if (looksLikePhoneNumber(query)) {
        try {
          const account = await getAccount(query.replace(/[\s-]/g, ""));
          proceedWithAccount(account.id, account.preferredLanguage);
          return;
        } catch {
          setLoginError("No account found with that phone number. Check it, or try their name instead.");
          return;
        }
      }
      const matches = await searchAccountsByName(query);
      if (matches.length === 0) {
        setLoginError("No account found with that name. Check the spelling, or try their phone number.");
      } else if (matches.length === 1) {
        const account = await getAccount(matches[0].id);
        proceedWithAccount(account.id, account.preferredLanguage);
      } else {
        setNameMatches(matches);
      }
    } catch {
      setLoginError("Couldn't reach the backend — check it's running.");
    } finally {
      setInserting(false);
    }
  }

  async function onSelectNameMatch(id: string) {
    setInserting(true);
    try {
      const account = await getAccount(id);
      proceedWithAccount(account.id, account.preferredLanguage);
    } catch {
      setLoginError("Couldn't reach the backend — check it's running.");
    } finally {
      setInserting(false);
    }
  }

  async function captureLoginByVoice() {
    if (isRecording) { recorderRef.current?.stop(); return; }
    setIsRecording(true);
    const rec = await recordAudio();
    recorderRef.current = rec;
    rec.result.then(async (blob) => {
      setIsRecording(false);
      try {
        const { text } = await voiceProcess(blob, LANGUAGES[langIdx].code);
        setLoginQuery(text);
      } catch {
        setLoginError("Couldn't hear that clearly — try typing instead.");
      }
    });
  }

  function onKeypadPress(key: string) {
    if (isSpeaking || !/\d/.test(key)) return;
    if (step === "card") {
      setLoginQuery((prev) => prev + key);
    } else if (step === "clarify" && tx?.needsClarification === "accountNumber") {
      setAccountNumberInput((prev) => (prev + key).slice(0, 10));
    }
  }

  async function onSubmitAccountNumber() {
    if (!tx) return;
    setAccountNumberError("");
    setAccountNumberBusy(true);
    let resolved: TransactionRecord;
    try {
      resolved = await resolveRecipientByAccount(tx.id, accountNumberInput, bankCode);
    } finally {
      setAccountNumberBusy(false);
    }
    setTx(resolved);

    if (resolved.state === "CONFIRMATION_REQUIRED") {
      const lang = LANGUAGES[langIdx].code;
      await speak(confirmPhraseFor(lang, resolved.action, resolved.amount, resolved.recipient), lang);
      setStep("confirm");
      return;
    }
    if (resolved.state === "INSUFFICIENT_FUNDS") {
      setErrorCode("INSUFFICIENT_FUNDS");
      setStep("error");
      return;
    }
    if (resolved.error === "ACCOUNT_NOT_FOUND") {
      setAccountNumberError("That account number isn't recognized. Check it and try again.");
    }
  }

  async function onAuthFaceResult(matched: boolean) {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    if (matched) {
      const lang = LANGUAGES[langIdx].code;
      try {
        const account = await getAccount(userId);
        await speak(phrase(lang, "welcomeBack", account.name), lang);
      } catch {
        /* welcome message is a nicety — proceed either way */
      }
      setStep("listen");
      return;
    }
    await speak(phrase(LANGUAGES[langIdx].code, "faceAuthFailed"), LANGUAGES[langIdx].code);
    setStep("authFailed");
  }

  async function captureAndAuthFace() {
    if (!videoRef.current) return;
    setFaceStatus("Looking for your face...");
    const descriptor = await captureFaceDescriptor(videoRef.current);
    if (!descriptor) {
      setFaceStatus("Couldn't find a face — look straight at the camera and try again.");
      return;
    }
    try {
      const result = await authorizeFace(userId, descriptor);
      setFaceStatus("");
      await onAuthFaceResult(result.authorized);
    } catch {
      setFaceStatus("Couldn't reach the backend — try again.");
    }
  }

  async function toggleListenRecording() {
    if (!isRecording) {
      setIsRecording(true);
      const rec = await recordAudio();
      recorderRef.current = rec;
      rec.result.then(async (blob) => {
        setIsRecording(false);
        try {
          const langCode = LANGUAGES[langIdx].code;
          const { text, intent } = await voiceProcess(blob, langCode);
          setTranscript(text);
          await handleIntent(intent);
        } catch {
          setErrorCode("NETWORK_ERROR");
          setStep("error");
        }
      });
    } else {
      recorderRef.current?.stop();
    }
  }

  async function quickDemo(kind: "send" | "balance" | "withdraw" | "deposit" | "airtime") {
    const demos: Record<string, { action: Action; amount: number | null; recipient: string | null; confidence: number }> = {
      send: { action: "send", amount: 10000, recipient: "adewale", confidence: 0.95 },
      balance: { action: "balance", amount: null, recipient: null, confidence: 0.95 },
      withdraw: { action: "withdraw", amount: 5000, recipient: null, confidence: 0.95 },
      deposit: { action: "deposit", amount: 20000, recipient: null, confidence: 0.95 },
      airtime: { action: "airtime", amount: 500, recipient: "08012345678", confidence: 0.95 }
    };
    await handleIntent(demos[kind]);
  }

  async function handleIntent(intent: { action: Action; amount: number | null; recipient: string | null; confidence: number }) {
    if (intent.action === "balance") {
      const b = await getBalance(userId);
      await speak(phrase(LANGUAGES[langIdx].code, "balance", b.balance), LANGUAGES[langIdx].code);
      setBalance(b.balance);
      setStep("balance");
      return;
    }

    const created = await confirmCreate(userId, intent.action, intent.amount, intent.recipient, intent.confidence);
    setTx(created);

    if (created.state === "LOW_AI_CONFIDENCE" || created.state === "UNKNOWN_RECIPIENT") {
      setStep("clarify");
      return;
    }
    if (created.state === "INVALID_AMOUNT" || created.state === "INSUFFICIENT_FUNDS") {
      setErrorCode(created.state);
      setStep("error");
      return;
    }
    if (created.state === "CONFIRMATION_REQUIRED") {
      const lang = LANGUAGES[langIdx].code;
      await speak(confirmPhraseFor(lang, created.action, created.amount, created.recipient), lang);
      setStep("confirm");
      return;
    }
    setErrorCode("TRANSACTION_FAILED");
    setStep("error");
  }

  async function onCancel() {
    if (tx) await cancelTransaction(tx.id);
    resetAll();
  }

  async function finalizeTransaction(txId: string) {
    setStep("processing");
    const sent = await sendTransaction(txId);
    setTx(sent);

    if (sent.state !== "TRANSACTION_SUCCESS") {
      setErrorCode(sent.state === "BMONI_API_ERROR" ? "BMONI_API_ERROR" : "TRANSACTION_FAILED");
      setStep("error");
      return;
    }

    const r = await getReceipt(sent.id);
    setReceipt(r);
    const lang = LANGUAGES[langIdx].code;
    await speak(successPhraseFor(lang, sent.action, sent.amount, sent.recipient), lang);
    setStep("receipt");
  }

  async function onConfirm() {
    if (!tx) return;
    const advanced = await confirmAdvance(tx.id);
    setTx(advanced);
    setStep("face");
  }

  async function onFaceResult(matched: boolean, descriptor?: number[]) {
    if (!tx) return;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    const verified = await verifyFace(tx.id, descriptor ? { faceDescriptor: descriptor } : { matched });
    setTx(verified);

    if (verified.state !== "FACE_VERIFIED") {
      setErrorCode("FACE_VERIFICATION_FAILED");
      setStep("error");
      return;
    }
    await finalizeTransaction(verified.id);
  }

  async function captureAndVerifyFace() {
    if (!videoRef.current || !tx) return;
    setFaceStatus("Looking for your face...");
    const descriptor = await captureFaceDescriptor(videoRef.current);
    if (!descriptor) {
      setFaceStatus("Couldn't find a face — look straight at the camera and try again.");
      return;
    }
    setFaceStatus("");
    await onFaceResult(true, descriptor);
  }

  function downloadReceipt() {
    if (!receipt) return;
    const text = `ElderPay Receipt\n------------------\nTransaction ID: ${receipt.transactionId}\nType: ${receipt.type}\nAmount: NGN ${receipt.amount}\nRecipient: ${receipt.recipient || "-"}\nReference: ${receipt.reference}\nDate: ${receipt.date}\nEnvironment: ${receipt.environment}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${receipt.transactionId}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  const titles: Record<Step, [string, string]> = {
    card: ["ElderPay", "Plug in the customer's card, then look them up by name or phone number."],
    faceAuth: ["Verify it's you", "A quick face check confirms it's you."],
    authFailed: ["Couldn't verify you", "Please speak with the agent for help."],
    listen: ["ElderPay", "Tap and speak — or try a quick demo phrase."],
    confirm: ["Confirm", "Check the details before continuing."],
    clarify: ["One more thing", "I need a bit more detail."],
    error: ["Let's try that again", ""],
    face: ["Verify it's you", "A quick face check keeps this secure."],
    processing: ["Processing", "Talking to BMONI sandbox..."],
    balance: ["Your balance", ""],
    receipt: ["Done", "Your transfer is complete."]
  };
  const [title, defaultSub] = titles[step];
  const sub = step === "receipt" && tx ? `Your ${successTitle(tx.action).toLowerCase()} is complete.` : defaultSub;

  return (
    <DeviceFrame showReceiptPrint={step === "receipt"} cardSlotActive={inserting} onKeypadPress={onKeypadPress}>
      <div style={s.appCard}>
        <header style={s.header}>
          <div style={s.topRow}>
            <Link to="/" style={s.backLink}>← ElderPay</Link>
            <span style={s.demoBadge}>Hackathon Prototype</span>
          </div>
          <h1 style={s.h1}>{title}</h1>
          <p style={s.sub}>{sub}</p>
        </header>

        <main style={s.main}>
          <SpeakingIndicator />
          {isSpeaking && <div style={s.speakingBlock} aria-hidden="true" />}
          {step === "card" && (
            <div style={s.micStage}>
              <div style={{ ...s.cardVisual, ...(inserting ? s.cardVisualInserting : {}) }}>
                <div style={s.cardTopRow}>
                  <div style={s.cardBrand}>GTBank</div>
                  <div style={s.cardChip} />
                </div>
                <div style={s.cardNumberDisplay}>•••• •••• •••• ••••</div>
                <div style={s.cardBottomRow}>
                  <div style={s.cardTypeLabel}>VERVE</div>
                </div>
              </div>
              <div style={s.hint}>Plug the card into the POS, then look the customer up by name or phone number.</div>
              <input
                style={s.input}
                value={loginQuery}
                onChange={(e) => setLoginQuery(e.target.value)}
                placeholder="Name or phone number"
                disabled={inserting}
              />
              <button style={{ ...s.micBtn, ...(isRecording ? s.micBtnRecording : {}) }} onClick={captureLoginByVoice}>🎤</button>
              {loginError && <div style={s.cardErrorText}>{loginError}</div>}
              {nameMatches && nameMatches.length > 1 && (
                <div style={{ width: "100%" }}>
                  <div style={s.hint}>More than one match — which one is you?</div>
                  {nameMatches.map((m) => (
                    <button key={m.id} style={{ ...s.btn, ...s.btnGhost, width: "100%", marginBottom: 8 }} onClick={() => onSelectNameMatch(m.id)} disabled={inserting}>{m.name}</button>
                  ))}
                </div>
              )}
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} disabled={inserting || !loginQuery.trim()} onClick={onSubmitLogin}>{inserting ? "Looking up..." : "Continue"}</button>
              <div style={s.quickRow}>
                <span className="clickable" style={s.quickBtn} onClick={() => setLoginQuery("Olawale Zainab")}>Demo customer: Olawale Zainab</span>
              </div>
              <div style={s.hint}>New here? <Link to="/onboarding" style={{ color: "var(--indigo)", fontWeight: 700 }}>Onboard a customer</Link></div>
            </div>
          )}

          {step === "faceAuth" && (
            <div style={s.faceStage}>
              <video ref={videoRef} autoPlay playsInline muted style={s.video} />
              {faceRegistered ? (
                <>
                  <div style={s.hint}>Look at the camera, then tap to verify.</div>
                  <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} onClick={captureAndAuthFace}>Verify my face</button>
                  <div style={s.hint}>{faceStatus}</div>
                </>
              ) : (
                <>
                  <div style={s.mockNote}>No face on file for this demo account. Match/no-match is simulated here — swap in a real verification provider before production use.</div>
                  <div style={{ ...s.actionRow, width: "100%" }}>
                    <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => onAuthFaceResult(false)}>Simulate: no match</button>
                    <button style={{ ...s.btn, ...s.btnGold }} onClick={() => onAuthFaceResult(true)}>Simulate: match ✓</button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "authFailed" && (
            <>
              <div style={s.errorCard}>We couldn't verify it's you by face. Please speak with the agent for help.</div>
              <div style={s.actionRow}>
                <button style={{ ...s.btn, ...s.btnPrimary, flex: 1 }} onClick={() => setStep("card")}>Try again</button>
              </div>
            </>
          )}

          {step === "listen" && (
            <>
              <div style={s.langRow}>
                {LANGUAGES.map((l, i) => (
                  <div className="clickable" key={l.code + i} style={{ ...s.langChip, ...(i === langIdx ? s.langChipActive : {}) }} onClick={() => setLangIdx(i)}>{l.label}</div>
                ))}
              </div>
              <div style={s.micStage}>
                <button style={{ ...s.micBtn, ...(isRecording ? s.micBtnRecording : {}) }} onClick={toggleListenRecording}>🎤</button>
                <div style={s.transcript}>{transcript || "\u00A0"}</div>
                <div style={s.hint}>Tap and speak, e.g. "Send 10,000 to Adewale"</div>
                <div style={s.quickRow}>
                  <span className="clickable" style={s.quickBtn} onClick={() => quickDemo("send")}>Demo: Send ₦10,000</span>
                  <span className="clickable" style={s.quickBtn} onClick={() => quickDemo("balance")}>Demo: Check balance</span>
                  <span className="clickable" style={s.quickBtn} onClick={() => quickDemo("withdraw")}>Demo: Withdraw ₦5,000</span>
                  <span className="clickable" style={s.quickBtn} onClick={() => quickDemo("deposit")}>Demo: Deposit ₦20,000</span>
                  <span className="clickable" style={s.quickBtn} onClick={() => quickDemo("airtime")}>Demo: Buy ₦500 airtime</span>
                </div>
              </div>
            </>
          )}

          {step === "confirm" && tx && (
            <>
              <div style={s.confirmCard}>
                <div style={s.to}>{actionTitle(tx.action)}</div>
                <div style={s.amount}>₦{(tx.amount || 0).toLocaleString()}</div>
                <div style={s.to}>
                  {tx.action === "send"
                    ? `to ${tx.recipient}${tx.recipientAccount ? ` (${tx.recipientAccount})` : ""}`
                    : tx.action === "airtime" ? `for ${tx.recipient}` : ""}
                </div>
                <div style={s.badgeRow}><span style={{ ...s.badge, ...s.badgeGold }}>Confidence {Math.round((tx.confidence || 0) * 100)}%</span></div>
              </div>
              <span
                className="clickable"
                style={s.linkText}
                onClick={() => speak(confirmPhraseFor(LANGUAGES[langIdx].code, tx.action, tx.amount, tx.recipient), LANGUAGES[langIdx].code)}
              >🔊 Repeat prompt</span>
              <div style={s.actionRow}>
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={onCancel}>No, cancel</button>
                <button style={{ ...s.btn, ...s.btnPrimary }} onClick={onConfirm}>Yes, continue</button>
              </div>
            </>
          )}

          {step === "clarify" && tx?.needsClarification === "accountNumber" && (
            <div style={s.micStage}>
              <div style={{ ...s.to, fontSize: 15, color: "var(--indigo)", fontWeight: 600, textAlign: "center" }}>
                I don't recognize that name. Agent: ask the customer for the recipient's bank and account number, and enter it below.
              </div>
              <select style={s.input} value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={accountNumberBusy}>
                <option value="">{banks.length ? "Select bank" : "Loading banks..."}</option>
                {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <input
                style={s.input}
                value={accountNumberInput}
                onChange={(e) => setAccountNumberInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Account number"
                inputMode="numeric"
                disabled={accountNumberBusy}
              />
              {accountNumberError && <div style={s.cardErrorText}>{accountNumberError}</div>}
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} disabled={accountNumberInput.length < 10 || !bankCode || accountNumberBusy} onClick={onSubmitAccountNumber}>{accountNumberBusy ? "Looking up..." : "Look up"}</button>
            </div>
          )}

          {step === "clarify" && tx?.needsClarification !== "accountNumber" && (
            <>
              <div style={s.confirmCard}>
                <div style={{ ...s.to, fontSize: 15, color: "var(--indigo)", fontWeight: 600 }}>
                  {tx?.needsClarification === "amount"
                    ? "How much would you like to send?"
                    : tx?.action === "airtime"
                      ? "What phone number should I top up?"
                      : "Who would you like to send it to? Try one of: Adewale, Ngozi, Ibrahim."}
                </div>
              </div>
              <div style={s.actionRow}><button style={{ ...s.btn, ...s.btnGhost, flex: 1 }} onClick={resetAll}>Start over</button></div>
            </>
          )}

          {step === "error" && (
            <>
              <div style={s.errorCard}>{ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default}</div>
              <div style={s.actionRow}><button style={{ ...s.btn, ...s.btnPrimary, flex: 1 }} onClick={resetAll}>Try again</button></div>
            </>
          )}

          {step === "face" && (
            <div style={s.faceStage}>
              <video ref={videoRef} autoPlay playsInline muted style={s.video} />
              {faceRegistered ? (
                <>
                  <div style={s.hint}>Look at the camera, then tap to verify.</div>
                  <button style={{ ...s.btn, ...s.btnPrimary, width: "100%" }} onClick={captureAndVerifyFace}>Verify my face</button>
                  <div style={s.hint}>{faceStatus}</div>
                </>
              ) : (
                <>
                  <div style={s.mockNote}>No face on file for this demo account. Match/no-match is simulated here — swap in a real verification provider before production use.</div>
                  <div style={{ ...s.actionRow, width: "100%" }}>
                    <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => onFaceResult(false)}>Simulate: no match</button>
                    <button style={{ ...s.btn, ...s.btnGold }} onClick={() => onFaceResult(true)}>Simulate: match ✓</button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "processing" && (
            <div style={s.statusStage}>
              <div style={s.spinner} />
              <div>Sending to BMONI sandbox...</div>
              <div style={s.badgeRow}>
                <span style={s.badge}>Test data only</span>
                <span style={{ ...s.badge, ...s.badgeGold }}>Sandbox-mock</span>
              </div>
            </div>
          )}

          {step === "balance" && (
            <>
              <div style={s.confirmCard}>
                <div style={s.to}>Account balance</div>
                <div style={s.amount}>₦{(balance || 0).toLocaleString()}</div>
              </div>
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%", marginTop: 16 }} onClick={resetAll}>New request</button>
            </>
          )}

          {step === "receipt" && receipt && tx && (
            <>
              <div style={s.receipt}>
                <h3 style={s.receiptH3}>✓ {successTitle(tx.action)} successful</h3>
                <div style={s.receiptRow}><span>Amount</span><span>₦{(tx.amount || 0).toLocaleString()}</span></div>
                {tx.action === "send" && (
                  <div style={s.receiptRow}>
                    <span>Recipient</span>
                    <span>{tx.recipient}{tx.recipientAccount ? ` (${tx.recipientAccount})` : ""}</span>
                  </div>
                )}
                {tx.action === "airtime" && <div style={s.receiptRow}><span>Phone number</span><span>{tx.recipient}</span></div>}
                <div style={s.receiptRow}><span>Transaction ID</span><span>{receipt.transactionId}</span></div>
                <div style={s.receiptRow}><span>Reference</span><span>{receipt.reference}</span></div>
                <div style={s.receiptRow}><span>Date</span><span>{new Date(receipt.date).toLocaleString()}</span></div>
                <div style={s.receiptRow}><span>Environment</span><span>{receipt.environment}</span></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={downloadReceipt}>Download</button>
                <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => window.print()}>Print</button>
              </div>
              <button style={{ ...s.btn, ...s.btnPrimary, width: "100%", marginTop: 10 }} onClick={resetAll}>New request</button>
            </>
          )}
        </main>

        <footer style={s.footer}>
          <span className="clickable" style={s.resetLink} onClick={resetAll}>Start over</span>
          <span style={{ margin: "0 8px", color: "#c9c2b4" }}>·</span>
          <Link to={`/history?userId=${encodeURIComponent(userId)}`} style={s.resetLink}>History</Link>
        </footer>
      </div>
    </DeviceFrame>
  );
}

const s: Record<string, React.CSSProperties> = {
  cardVisual: { width: "100%", aspectRatio: "1.586", maxHeight: 150, borderRadius: 16, background: "linear-gradient(135deg, #FF8A1F 0%, #E85D00 55%, #C94800 100%)", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 14px 30px rgba(232,93,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)" },
  cardVisualInserting: { animation: "cardInsert 550ms ease-in forwards" },
  cardTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardBrand: { fontSize: 18, fontWeight: 800, fontStyle: "italic", letterSpacing: "0.02em", color: "#fff" },
  cardChip: { width: 34, height: 26, borderRadius: 5, background: "linear-gradient(135deg, var(--gold-light), var(--gold))", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" },
  cardNumberDisplay: { fontFamily: "monospace", fontSize: 17, letterSpacing: "0.06em", color: "var(--paper)" },
  cardBottomRow: { display: "flex", justifyContent: "flex-end" },
  cardTypeLabel: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.85)" },
  cardErrorText: { color: "var(--alert)", fontSize: "12.5px", textAlign: "center" },
  linkText: { color: "var(--indigo)", fontWeight: 700, textDecoration: "underline" },
  appCard: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line)" },
  header: { background: "linear-gradient(135deg, var(--indigo) 0%, var(--indigo-deep) 100%)", color: "var(--paper)", padding: "22px 26px 18px", position: "relative", overflow: "hidden" },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, position: "relative", zIndex: 1 },
  backLink: { color: "var(--gold-light)", fontSize: 12, textDecoration: "none" },
  demoBadge: { fontSize: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", background: "linear-gradient(135deg, var(--gold-light), var(--gold))", color: "#fff", padding: "4px 10px", borderRadius: 100, boxShadow: "0 2px 8px rgba(201,138,44,0.4)" },
  h1: { fontFamily: "Fraunces, serif", fontWeight: 700, fontSize: 22, margin: "0 0 4px", position: "relative", zIndex: 1 },
  sub: { margin: 0, fontSize: 12, color: "rgba(245,239,226,0.75)", position: "relative", zIndex: 1 },
  main: { padding: "24px 26px", minHeight: 360, display: "flex", flexDirection: "column", position: "relative" },
  speakingBlock: { position: "absolute", inset: 0, zIndex: 5, cursor: "not-allowed", background: "transparent" },
  label: { fontSize: 13, fontWeight: 600, color: "#5c5346", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 15, marginBottom: 14, transition: "border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out)" },
  micStage: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 14, padding: "4px 0" },
  micBtn: { width: 92, height: 92, borderRadius: "50%", border: "none", background: "linear-gradient(150deg, var(--gold-light), var(--gold))", color: "#fff", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-gold)" },
  micBtnRecording: { background: "linear-gradient(150deg, #d9564a, var(--alert))", animation: "micRing 1.4s ease-out infinite" },
  hint: { fontSize: "12.5px", color: "#6b6357", textAlign: "center", maxWidth: 290 },
  transcript: { fontFamily: "Fraunces, serif", fontSize: "16.5px", textAlign: "center", color: "var(--indigo)", minHeight: 24, padding: "0 8px" },
  quickRow: { display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", justifyContent: "center" },
  quickBtn: { border: "1px solid var(--line)", background: "#fff", padding: "7px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600 },
  langRow: { display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" },
  langChip: { border: "1px solid var(--line)", background: "#fff", padding: "6px 11px", borderRadius: 100, fontSize: 12, fontWeight: 600 },
  langChipActive: { background: "var(--indigo)", color: "#fff", borderColor: "var(--indigo)" },
  confirmCard: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, textAlign: "center", animation: "fadeInUp 320ms var(--ease-out)" },
  amount: { fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 800, color: "var(--indigo)", margin: "6px 0" },
  to: { fontSize: "13.5px", color: "#6b6357" },
  actionRow: { display: "flex", gap: 10, marginTop: 16 },
  btn: { flex: 1, padding: 13, borderRadius: 12, border: "none", fontWeight: 700, fontSize: "14.5px" },
  btnPrimary: { background: "linear-gradient(135deg, var(--indigo), var(--indigo-deep))", color: "#fff", boxShadow: "var(--shadow-sm)" },
  btnGhost: { background: "#fff", color: "var(--charcoal)", border: "1px solid var(--line)" },
  btnGold: { background: "linear-gradient(135deg, var(--gold-light), var(--gold))", color: "#fff", boxShadow: "var(--shadow-gold)" },
  badgeRow: { display: "flex", gap: 6, justifyContent: "center", marginTop: 10, flexWrap: "wrap" },
  badge: { fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 100, background: "var(--indigo)", color: "var(--paper)" },
  badgeGold: { background: "linear-gradient(135deg, var(--gold-light), var(--gold))" },
  errorCard: { background: "#fdf1ef", border: "1px solid #f0c7be", borderRadius: 14, padding: 18, textAlign: "center", color: "var(--alert)", fontSize: 14, animation: "fadeInUp 320ms var(--ease-out)" },
  video: { width: 190, height: 190, borderRadius: "50%", objectFit: "cover", border: "4px solid var(--gold)", background: "var(--indigo-deep)", boxShadow: "var(--shadow-gold)" },
  faceStage: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flex: 1, justifyContent: "center" },
  mockNote: { fontSize: "10.5px", color: "#a08a5f", background: "#fbf3e2", border: "1px dashed #d9b978", padding: "6px 10px", borderRadius: 8, textAlign: "center" },
  statusStage: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, flex: 1, textAlign: "center" },
  spinner: { width: 36, height: 36, borderRadius: "50%", border: "4px solid var(--line)", borderTopColor: "var(--gold)", animation: "spin .9s linear infinite" },
  receipt: { background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 18, animation: "popIn 420ms var(--ease-spring)" },
  receiptH3: { fontFamily: "Fraunces, serif", margin: "0 0 12px", color: "var(--success)", fontSize: 18, fontWeight: 700 },
  receiptRow: { display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed var(--line)" },
  footer: { padding: "12px 26px 18px", textAlign: "center" },
  resetLink: { fontSize: 12, color: "#8a8175", textDecoration: "underline" }
};
