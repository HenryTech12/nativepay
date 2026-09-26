import { TransactionIntent, LanguageCode } from '../types';

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

  // Language mapping
  const langMap: Record<LanguageCode, string> = {
    en: 'en-NG',
    pcm: 'en-NG',
    yo: 'yo-NG',
    ha: 'ha-NG',
    ig: 'ig-NG',
  };
  recognition.lang = langMap[languageCode] || 'en-NG';

  let hasEnded = false;

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

    if (interimText) onInterim(interimText.trim());
    if (finalText) {
      hasEnded = true;
      onFinal(finalText.trim());
    }
  };

  recognition.onerror = (event) => {
    const errorType = event.error || 'speech_recognition_error';
    if (errorType === 'no-speech') {
      onError('No speech detected. Please tap and speak clearly.');
    } else if (errorType === 'not-allowed') {
      onError('Microphone access was denied. Please allow microphone permission in browser settings.');
    } else {
      onError(`Speech recognition error: ${errorType}`);
    }
  };

  recognition.onend = () => {
    if (!hasEnded) {
      // Completed without final event
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

/**
 * Native audio speech synthesis for high reliability feedback.
 */
export function speakText(text: string, languageCode: LanguageCode = 'en'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for accessibility & elderly clarity
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.includes('NG') || v.lang.includes('en-GB') || v.lang.includes('en-US')
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    // Fallback timeout in case speech engine hangs
    setTimeout(() => resolve(), 7000);

    window.speechSynthesis.speak(utterance);
  });
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
    const amount = extractAmount(lower) || 1000;
    const phoneMatch = text.match(/(0[789][01]\d{8}|\+?234[789][01]\d{8})/);
    const recipient = phoneMatch ? phoneMatch[0] : 'My Phone';

    return {
      action: 'airtime',
      amount,
      recipient,
      confidence: 0.92,
      rawText: text,
      suggestedNarration: 'Airtime recharge',
    };
  }

  // Withdrawal detection
  if (
    lower.includes('withdraw') ||
    lower.includes('cash out') ||
    lower.includes('collect cash') ||
    lower.includes('take money')
  ) {
    const amount = extractAmount(lower) || 5000;
    return {
      action: 'withdraw',
      amount,
      recipient: 'Cash Withdrawal',
      confidence: 0.94,
      rawText: text,
      suggestedNarration: 'Agent POS Cash Withdrawal',
    };
  }

  // Default: Transfer / Send Money
  const amount = extractAmount(lower) || 5000;
  const recipient = extractRecipient(text) || 'Ada Okafor';

  return {
    action: 'transfer',
    amount,
    recipient,
    confidence: 0.95,
    rawText: text,
    suggestedNarration: `Transfer to ${recipient}`,
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
      // Ignore common filler words
      if (!['naira', 'account', 'bank', 'him', 'her', 'them', 'money'].includes(lower)) {
        // Capitalize nicely
        return rawName
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  // Default known demo recipients if matched
  const knownRecipients = ['Ada Okafor', 'John Doe', 'Olawale Zainab', 'Musa Bello', 'Chidi Obi', 'Bisi Adeleke'];
  for (const name of knownRecipients) {
    const firstName = name.split(' ')[0].toLowerCase();
    if (text.toLowerCase().includes(firstName)) {
      return name;
    }
  }

  return 'Ada Okafor';
}
