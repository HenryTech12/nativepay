import { TransactionIntent, LanguageCode } from '../types';
import { api } from './api';

export class VoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start(): Promise<void> {
    this.cleanup();
    this.audioChunks = [];

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (err) {
      this.cleanup();
      throw err;
    }
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.cleanup();
        reject(new Error('Recorder not initialized'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(audioBlob);
      };

      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }
}

// Global helper for browser speech recognition
type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: Event & { error?: string }) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function listenToBrowserSpeech(
  languageCode: LanguageCode,
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (err: string) => void
): { stop: () => void } {
  const SpeechRec = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

  if (!SpeechRec) {
    onError('Speech recognition not supported in this browser.');
    return { stop: () => {} };
  }

  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;

  // Language mapping with robust fallbacks for mobile browsers
  const langMap: Record<LanguageCode, string> = {
    en: 'en-NG',
    pcm: 'en-NG',
    yo: 'yo-NG',
    ha: 'ha-NG',
    ig: 'ig-NG',
  };
  recognition.lang = langMap[languageCode] || 'en-NG';

  let hasEnded = false;
  let lastCapturedText = '';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimText = '';
    let finalText = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }

    if (interimText) {
      lastCapturedText = interimText.trim();
      onInterim(lastCapturedText);
    }
    if (finalText) {
      hasEnded = true;
      lastCapturedText = finalText.trim();
      onFinal(lastCapturedText);
    }
  };

  recognition.onerror = (event) => {
    const errorType = event.error || 'speech_recognition_error';
    // If mobile Chrome fails to recognize language pack (language-not-supported), retry with en-US/en-NG
    if (errorType === 'language-not-supported' && recognition.lang !== 'en-US') {
      try {
        recognition.lang = 'en-US';
        recognition.start();
        return;
      } catch {
        // ignore
      }
    }
    if (errorType === 'no-speech') {
      onError('No speech detected. Please tap and speak clearly.');
    } else if (errorType === 'not-allowed') {
      onError('Microphone access was denied. Please allow microphone permission in browser settings.');
    } else {
      onError(`Speech recognition error: ${errorType}`);
    }
  };

  recognition.onend = () => {
    if (!hasEnded && lastCapturedText) {
      hasEnded = true;
      onFinal(lastCapturedText);
    }
  };

  try {
    recognition.start();
  } catch (e) {
    onError((e as Error).message);
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
  };
}

let currentCloudAudio: HTMLAudioElement | null = null;

/**
 * Plays a synthesized-speech audio Blob returned by the backend TTS provider.
 */
function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    if (currentCloudAudio) {
      try {
        currentCloudAudio.pause();
      } catch {
        // ignore
      }
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentCloudAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentCloudAudio === audio) currentCloudAudio = null;
    };

    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      resolve();
    };

    audio.play().catch(() => {
      cleanup();
      resolve();
    });
  });
}

/**
 * Speaks `text` in the user's selected language via the backend's YarnGPT
 * TTS provider (/api/tts). No client-side substitute is used: browsers'
 * speechSynthesis has no real Yoruba/Igbo/Hausa support, so silently
 * falling back to it would mean the user hears mispronounced audio while
 * believing the real voice feature is working. If the backend call fails,
 * this throws instead of masking the failure, so the caller can surface a
 * real error (e.g. "voice playback unavailable") instead of pretending
 * everything is fine.
 */
export async function speakText(text: string, languageCode: LanguageCode = 'en'): Promise<void> {
  if (!text) return;

  const cloudResult = await api.synthesizeSpeech(text, languageCode);
  if (!cloudResult.ok || !cloudResult.data) {
    console.error('[TTS] /api/tts failed:', cloudResult.error, cloudResult.technicalError);
    throw new Error(cloudResult.technicalError || cloudResult.error || 'TTS_UNAVAILABLE');
  }

  await playAudioBlob(cloudResult.data);
}

/**
 * Maps this frontend's action vocabulary to the backend's.
 * Backend (app/models.py Action literal): "send" | "balance" | "withdraw" |
 * "deposit" | "airtime" | "bill" | "unknown". Frontend TransactionAction:
 * "transfer" | "withdraw" | "airtime" | "balance" | "deposit". Every other
 * value passes through unchanged -- only "transfer"/"send" actually differ.
 */
export function toBackendAction(action: string): string {
  return action === 'transfer' ? 'send' : action;
}

export function fromBackendAction(action: string): TransactionIntent['action'] {
  if (action === 'send') return 'transfer';
  if (action === 'withdraw' || action === 'airtime' || action === 'balance' || action === 'deposit') {
    return action;
  }
  // Backend also has "bill" and "unknown", neither implemented on the
  // frontend -- treat as a transfer-shaped intent so it still surfaces
  // through the usual amount/recipient clarification flow rather than
  // silently vanishing.
  return 'transfer';
}

/**
 * Intelligent Client-Side Intent Parser.
 * Used for instant zero-latency understanding or as a safe fallback when the cloud AI key is invalid/offline.
 */
export function parseFinancialIntent(rawText: string): TransactionIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Balance query detection
  if (
    lower.includes('balance') ||
    lower.includes('how much') ||
    lower.includes('money wey dey') ||
    lower.includes('wetin dey') ||
    lower.includes('owo mi') ||
    lower.includes('kudin') ||
    lower.includes('ego m')
  ) {
    return {
      action: 'balance',
      amount: 0,
      recipient: 'Self',
      confidence: 0.98,
      rawText: text,
      suggestedNarration: 'Balance inquiry',
    };
  }

  // Airtime detection
  if (
    lower.includes('airtime') ||
    lower.includes('recharge') ||
    lower.includes('credit') ||
    lower.includes('card')
  ) {
    const amount = extractAmount(lower);
    const phoneMatch = text.match(/(0[789][01]\d{8}|\+?234[789][01]\d{8})/);
    // No wrong-recipient risk here: airtime with no phone number named
    // defaults to the customer's own line, never a third party.
    const recipient = phoneMatch ? phoneMatch[0] : 'My Phone';

    return {
      action: 'airtime',
      amount,
      recipient,
      confidence: amount ? 0.92 : 0.5,
      rawText: text,
      suggestedNarration: 'Airtime recharge',
      needsClarification: amount === null ? 'amount' : undefined,
    };
  }

  // Withdrawal detection
  if (
    lower.includes('withdraw') ||
    lower.includes('cash out') ||
    lower.includes('collect cash') ||
    lower.includes('take money')
  ) {
    const amount = extractAmount(lower);
    return {
      action: 'withdraw',
      amount,
      recipient: 'Cash Withdrawal',
      confidence: amount ? 0.94 : 0.5,
      rawText: text,
      suggestedNarration: 'Agent POS Cash Withdrawal',
      needsClarification: amount === null ? 'amount' : undefined,
    };
  }

  // Default: Transfer / Send Money.
  // IMPORTANT: unlike earlier versions of this parser, amount/recipient are
  // never guessed or defaulted here. A transfer with a missing amount or
  // recipient must be flagged via `needsClarification` so the caller asks
  // the user instead of silently executing against a fabricated value.
  const amount = extractAmount(lower);
  const recipient = extractRecipient(text);

  let needsClarification: TransactionIntent['needsClarification'];
  if (amount === null) needsClarification = 'amount';
  else if (!recipient) needsClarification = 'recipient';

  return {
    action: 'transfer',
    amount,
    recipient,
    confidence: amount !== null && recipient ? 0.9 : 0.4,
    rawText: text,
    suggestedNarration: recipient ? `Transfer to ${recipient}` : 'Transfer',
    needsClarification,
  };
}

/**
 * Extracts number / naira amount from speech phrase.
 * Handles "5000", "5,000", "5k", "twenty thousand", etc.
 */
function extractAmount(text: string): number | null {
  // Regex for numbers like 5,000 or 5000 or ₦5000
  const numMatch = text.match(/(?:[₦n]|naira\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\s*k)?/i);
  if (numMatch) {
    let numStr = numMatch[1].replace(/,/g, '');
    let val = parseInt(numStr, 10);
    if (text.toLowerCase().includes(numMatch[1].toLowerCase() + 'k')) {
      val *= 1000;
    }
    if (!isNaN(val) && val > 0) return val;
  }

  // Textual amounts
  const wordAmounts: Record<string, number> = {
    'one thousand': 1000,
    'two thousand': 2000,
    'three thousand': 3000,
    'four thousand': 4000,
    'five thousand': 5000,
    'ten thousand': 10000,
    'fifteen thousand': 15000,
    'twenty thousand': 20000,
    'thirty thousand': 30000,
    'fifty thousand': 50000,
    'one hundred thousand': 100000,
    '1k': 1000,
    '2k': 2000,
    '5k': 5000,
    '10k': 10000,
    '20k': 20000,
  };

  for (const [key, val] of Object.entries(wordAmounts)) {
    if (text.includes(key)) return val;
  }

  return null;
}

/**
 * Extracts recipient name from speech phrase.
 * e.g. "Send 5000 to Ada Okafor" -> "Ada Okafor"
 * e.g. "Transfer 2k give my brother Musa" -> "Musa"
 *
 * Returns null (never a guessed/default name) when no recipient can be
 * confidently identified in the transcript -- callers must ask the user
 * to clarify rather than send money to a fabricated recipient. Names
 * found here are still spoken-word guesses; the caller is responsible
 * for resolving the returned name against real NativePay accounts
 * before treating it as safe to transact against.
 */
function extractRecipient(text: string): string | null {
  // Patterns like "to <name>", "give <name>", "for <name>"
  const patterns = [
    /(?:to|give|dash|send)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    /(?:to|give|dash|send)\s+(?:my\s+(?:brother|sister|friend|mama|papa|pikin|wife|husband)\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) {
      const rawName = match[1].trim();
      const lower = rawName.toLowerCase();
      // Ignore common filler words that aren't actually names
      if (!['naira', 'account', 'bank', 'him', 'her', 'them', 'money'].includes(lower)) {
        // Capitalize nicely
        return rawName
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  return null;
}
