import { synthesizeSpeech } from "./api";

type Phrases = {
  confirmSend: (amt: number, name: string) => string;
  confirmWithdraw: (amt: number) => string;
  confirmDeposit: (amt: number) => string;
  confirmAirtime: (amt: number, phone: string) => string;
  successSend: (amt: number, name: string) => string;
  successWithdraw: (amt: number) => string;
  successDeposit: (amt: number) => string;
  successAirtime: (amt: number, phone: string) => string;
  balance: (amt: number) => string;
  askFullName: () => string;
  askEmail: () => string;
  askAddress: () => string;
  askRepeatDigits: (spoken: string) => string;
  askPhoneNumber: () => string;
  welcomeBack: (name: string) => string;
  faceAuthFailed: () => string;
  enrollmentComplete: () => string;
};

const T: Record<string, Phrases> = {
  en: {
    confirmSend: (a, n) => `You are about to send ${a} naira to ${n}. Should I continue?`,
    confirmWithdraw: (a) => `You are about to withdraw ${a} naira. Should I continue?`,
    confirmDeposit: (a) => `You are about to deposit ${a} naira. Should I continue?`,
    confirmAirtime: (a, p) => `You are about to buy ${a} naira airtime for ${p}. Should I continue?`,
    successSend: (a, n) => `Your transfer of ${a} naira to ${n} was successful.`,
    successWithdraw: (a) => `Your withdrawal of ${a} naira was successful.`,
    successDeposit: (a) => `Your deposit of ${a} naira was successful.`,
    successAirtime: (a, p) => `Your airtime purchase of ${a} naira for ${p} was successful.`,
    balance: (a) => `Your account balance is ${a} naira.`,
    askFullName: () => "Please tell the agent your full name.",
    askEmail: () => "Please tell the agent your email address.",
    askAddress: () => "Now please tell the agent your home address.",
    askRepeatDigits: (s) => `Please repeat these numbers after me: ${s}.`,
    askPhoneNumber: () => "What phone number should I top up?",
    welcomeBack: (n) => `Welcome back, ${n}.`,
    faceAuthFailed: () => "I couldn't verify your identity by face. Please speak with the agent.",
    enrollmentComplete: () => "You're all set. Your account is ready to use."
  },
  pcm: {
    confirmSend: (a, n) => `You wan send ${a} naira give ${n}. I go continue?`,
    confirmWithdraw: (a) => `You wan withdraw ${a} naira. I go continue?`,
    confirmDeposit: (a) => `You wan deposit ${a} naira. I go continue?`,
    confirmAirtime: (a, p) => `You wan buy ${a} naira airtime for ${p}. I go continue?`,
    successSend: (a, n) => `Your ${a} naira don successfully reach ${n}.`,
    successWithdraw: (a) => `Your ${a} naira withdrawal don successful.`,
    successDeposit: (a) => `Your ${a} naira deposit don successful.`,
    successAirtime: (a, p) => `Your ${a} naira airtime for ${p} don successful.`,
    balance: (a) => `Your balance na ${a} naira.`,
    askFullName: () => "Abeg tell the agent your full name.",
    askEmail: () => "Abeg tell the agent your email address.",
    askAddress: () => "Now abeg tell the agent your house address.",
    askRepeatDigits: (s) => `Abeg repeat these numbers after me: ${s}.`,
    askPhoneNumber: () => "Wetin be the phone number wey you wan top up?",
    welcomeBack: (n) => `Welcome back, ${n}.`,
    faceAuthFailed: () => "I no fit confam say na you by face. Abeg talk to the agent.",
    enrollmentComplete: () => "You don set. Your account don ready to use."
  },
  yo: {
    confirmSend: (a, n) => `O fẹ́ fi ${a} náírà ránṣẹ́ sí ${n}. Ṣé kí n tẹ̀síwájú?`,
    confirmWithdraw: (a) => `O fẹ́ yọ ${a} náírà kúrò. Ṣé kí n tẹ̀síwájú?`,
    confirmDeposit: (a) => `O fẹ́ fi ${a} náírà sí àkọọ́lẹ̀ rẹ. Ṣé kí n tẹ̀síwájú?`,
    confirmAirtime: (a, p) => `O fẹ́ ra ẹ̀rọ-ìjíròrò ${a} náírà fún ${p}. Ṣé kí n tẹ̀síwájú?`,
    successSend: (a, n) => `A ti fi ${a} náírà ránṣẹ́ sí ${n} ní àṣeyọrí.`,
    successWithdraw: (a) => `Yíyọ ${a} náírà ṣàṣeyọrí.`,
    successDeposit: (a) => `Fífi ${a} náírà sí àkọọ́lẹ̀ rẹ ṣàṣeyọrí.`,
    successAirtime: (a, p) => `Rírà ẹ̀rọ-ìjíròrò ${a} náírà fún ${p} ṣàṣeyọrí.`,
    balance: (a) => `Owó tó kù nínú àkọọ́lẹ̀ rẹ ni ${a} náírà.`,
    askFullName: () => "Jọ̀wọ́ sọ orúkọ rẹ ní kíkún fún aṣojú.",
    askEmail: () => "Jọ̀wọ́ sọ àdírẹ́sì í-méèlì rẹ fún aṣojú.",
    askAddress: () => "Nísisìyí, jọ̀wọ́ sọ àdírẹ́sì ilé rẹ fún aṣojú.",
    askRepeatDigits: (s) => `Jọ̀wọ́ tún àwọn nọ́mbà wọ̀nyí sọ lẹ́yìn mi: ${s}.`,
    askPhoneNumber: () => "Nọ́mbà fóònù wo ni kí n gbé kirẹ́ìjì sí?",
    welcomeBack: (n) => `Kú àbọ̀, ${n}.`,
    faceAuthFailed: () => "N kò lè fi ojú rẹ jẹ́rìí ẹni tí ìwọ jẹ́. Jọ̀wọ́ bá aṣojú sọ̀rọ̀.",
    enrollmentComplete: () => "O ti ṣetán. Àkọọ́lẹ̀ rẹ ti ṣetán láti lò."
  },
  ha: {
    confirmSend: (a, n) => `Kana son aika Naira ${a} zuwa ${n}. In ci gaba?`,
    confirmWithdraw: (a) => `Kana son cire Naira ${a}. In ci gaba?`,
    confirmDeposit: (a) => `Kana son ajiya Naira ${a}. In ci gaba?`,
    confirmAirtime: (a, p) => `Kana son sayan katin waya na Naira ${a} don ${p}. In ci gaba?`,
    successSend: (a, n) => `An yi nasarar aika Naira ${a} zuwa ${n}.`,
    successWithdraw: (a) => `An yi nasarar cire Naira ${a}.`,
    successDeposit: (a) => `An yi nasarar ajiya Naira ${a}.`,
    successAirtime: (a, p) => `An yi nasarar sayan katin waya na Naira ${a} don ${p}.`,
    balance: (a) => `Ma'aunin asusunku shine Naira ${a}.`,
    askFullName: () => "Don Allah faɗi cikakken sunanka ga wakili.",
    askEmail: () => "Don Allah faɗi adireshin imel ɗinka ga wakili.",
    askAddress: () => "Yanzu don Allah faɗi adireshin gidanka ga wakili.",
    askRepeatDigits: (s) => `Don Allah maimaita waɗannan lambobi bayan ni: ${s}.`,
    askPhoneNumber: () => "Wane lambar waya ne za a caji?",
    welcomeBack: (n) => `Barka da dawowa, ${n}.`,
    faceAuthFailed: () => "Ban iya tabbatar da ainihinka ta fuska ba. Don Allah ka tuntuɓi wakili.",
    enrollmentComplete: () => "An gama. Asusunka a shirye yake don amfani."
  },
  ig: {
    confirmSend: (a, n) => `Ị chọrọ izipu Naira ${a} nye ${n}. Ka m gaa n'ihu?`,
    confirmWithdraw: (a) => `Ị chọrọ iwepụ Naira ${a}. Ka m gaa n'ihu?`,
    confirmDeposit: (a) => `Ị chọrọ itinye Naira ${a} n'akaụntụ gị. Ka m gaa n'ihu?`,
    confirmAirtime: (a, p) => `Ị chọrọ ịzụ ekwentị Naira ${a} maka ${p}. Ka m gaa n'ihu?`,
    successSend: (a, n) => `Izipu Naira ${a} nye ${n} gara nke ọma.`,
    successWithdraw: (a) => `Iwepụ Naira ${a} gara nke ọma.`,
    successDeposit: (a) => `Itinye Naira ${a} n'akaụntụ gị gara nke ọma.`,
    successAirtime: (a, p) => `Ịzụ ekwentị Naira ${a} maka ${p} gara nke ọma.`,
    balance: (a) => `Ego fọdụrụ n'akaụntụ gị bụ Naira ${a}.`,
    askFullName: () => "Biko gwa onye nnọchite anya aha gị zuru ezu.",
    askEmail: () => "Biko gwa onye nnọchite anya adreesị ozi-e gị.",
    askAddress: () => "Ugbu a, biko gwa onye nnọchite anya adreesị ụlọ gị.",
    askRepeatDigits: (s) => `Biko kwughachi ọnụọgụgụ ndị a m kwuru: ${s}.`,
    askPhoneNumber: () => "Kedu nọmba ekwentị ka m ga-eji chaajị?",
    welcomeBack: (n) => `Nnọọ, ${n}.`,
    faceAuthFailed: () => "Enweghị m ike iji ihu gị kwado onye ị bụ. Biko gwa onye nnọchite anya.",
    enrollmentComplete: () => "Emechaala. Akaụntụ gị dị njikere iji."
  }
};

export function phrase<K extends keyof Phrases>(lang: string, key: K, ...args: Parameters<Phrases[K]>): string {
  const dict = T[lang] || T.en;
  const fn = dict[key] || T.en[key];
  return (fn as (...a: any[]) => string)(...args);
}

type SpeakingListener = (speaking: boolean) => void;
const speakingListeners = new Set<SpeakingListener>();
let isSpeakingNow = false;

function setSpeaking(value: boolean) {
  isSpeakingNow = value;
  speakingListeners.forEach((l) => l(value));
}

/** Subscribe to know whenever speak() is actively playing audio — used
 * to show a "speaking" indicator so users aren't left guessing whether
 * to wait or act while the voice prompt is still in flight. */
export function subscribeSpeaking(listener: SpeakingListener): () => void {
  speakingListeners.add(listener);
  listener(isSpeakingNow);
  return () => { speakingListeners.delete(listener); };
}

function speakWithBrowserVoice(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

const speechCache = new Map<string, Promise<Blob>>();

function cacheKey(text: string, lang: string): string {
  return `${lang}::${text}`;
}

/** Kicks off the /api/tts fetch ahead of time and caches the result, so
 * a later speak() for the same (text, lang) plays instantly instead of
 * waiting on the network round-trip — used to fetch a step's prompt
 * audio while the user is still on the *previous* step, so it's already
 * in hand the moment that step actually renders. */
export function prefetchSpeech(text: string, lang: string = "en"): void {
  const key = cacheKey(text, lang);
  if (speechCache.has(key)) return;
  const promise = synthesizeSpeech(text, lang);
  speechCache.set(key, promise);
  // Silent side-branch so a prefetch nobody ever awaits doesn't surface
  // as an unhandled rejection — speak() still sees the real failure via
  // its own await on this same cached promise if it's later consumed.
  promise.catch(() => { speechCache.delete(key); });
}

/**
 * Nigerian-accented read-back via YarnGPT (see backend/app/services/
 * yarngpt_service.py), falling back to the browser's generic
 * speechSynthesis if the API key isn't configured or the call fails.
 * Resolves only once the audio has actually finished playing — callers
 * rely on `await speak(...)` to know the message was fully heard before
 * moving the UI on to the next step, not just that playback started.
 * Reuses a prefetchSpeech() result when one is already in flight/cached
 * for this exact (text, lang) pair, so a prompt that was fetched ahead
 * of time plays the moment its step renders instead of lagging behind.
 */
export async function speak(text: string, lang: string = "en") {
  setSpeaking(true);
  try {
    const key = cacheKey(text, lang);
    const cached = speechCache.get(key);
    const blob = cached ? await cached : await synthesizeSpeech(text, lang);
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    let playbackBlocked = false;
    await new Promise<void>((resolve) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => { playbackBlocked = true; URL.revokeObjectURL(url); resolve(); });
    });
    // audio.play() can be silently blocked by the browser's autoplay
    // policy (common on mobile when too much time passes between the
    // triggering tap and playback starting, e.g. the TTS fetch itself) —
    // fall back to speechSynthesis instead of playing nothing at all.
    if (playbackBlocked) {
      await speakWithBrowserVoice(text);
    }
  } catch {
    await speakWithBrowserVoice(text);
  } finally {
    setSpeaking(false);
  }
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pcm", label: "Pidgin" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" }
];
