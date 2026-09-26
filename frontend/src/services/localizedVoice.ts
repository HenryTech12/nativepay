import { LanguageCode } from '../types';

export interface SpokenPhrases {
  balanceResponse: (balance: number) => string;
  transferConfirm: (amount: number, recipient: string) => string;
  withdrawConfirm: (amount: number) => string;
  airtimeConfirm: (amount: number, recipient: string) => string;
  cameraPrompt: string;
  verifyingIdentity: string;
  identityVerified: string;
  transferSuccess: (amount: number, recipient: string, reference: string) => string;
  withdrawSuccess: (amount: number, reference: string) => string;
  airtimeSuccess: (amount: number, recipient: string, reference: string) => string;
  balanceSuccess: (balance: number) => string;
  insufficientFunds: (balance: number, requested: number) => string;
  didNotCatch: string;
}

export const LOCALIZED_VOICE_PHRASES: Record<LanguageCode, SpokenPhrases> = {
  // Yorùbá
  yo: {
    balanceResponse: (bal) => `Owó tó wà nínú àkọọ́lẹ̀ yín jẹ́ náírà ẹgbẹ̀rún ${bal.toLocaleString()}.`,
    transferConfirm: (amt, rec) => `Ẹ fẹ́ fi náírà ${amt.toLocaleString()} ránṣẹ́ sí ${rec}. Ẹ jọ̀wọ́, ẹ fi ìdí rẹ̀ múlẹ̀.`,
    withdrawConfirm: (amt) => `Ẹ fẹ́ gba owó tútù náírà ${amt.toLocaleString()}. Ẹ jọ̀wọ́, ẹ fi ìdí rẹ̀ múlẹ̀.`,
    airtimeConfirm: (amt, rec) => `Ẹ fẹ́ ra káàdì náírà ${amt.toLocaleString()} fún ${rec}. Ẹ jọ̀wọ́, ẹ fi ìdí rẹ̀ múlẹ̀.`,
    cameraPrompt: 'Ẹ jọ̀wọ́, ẹ wo inú kámẹ́rà láti fi ojú yín fìdí ìdánimọ̀ múlẹ̀.',
    verifyingIdentity: 'À ń yẹ ojú yín wò lọ́wọ́.',
    identityVerified: 'Ìdánimọ̀ yín ti fìdí múlẹ̀. À ń ṣe ìfowóránṣẹ́ náà lọ́wọ́.',
    transferSuccess: (amt, rec, ref) => `Ìfowóránṣẹ́ yọrí sí rere! A ti fi náírà ${amt.toLocaleString()} ránṣẹ́ sí ${rec}. Nọ́mbà ìdánimọ̀ ni ${ref}.`,
    withdrawSuccess: (amt, ref) => `Ìfowópamọ́ yọrí sí rere! Ẹ gba náírà ${amt.toLocaleString()} yín. Nọ́mbà ni ${ref}.`,
    airtimeSuccess: (amt, rec, ref) => `Káàdì náírà ${amt.toLocaleString()} ti wọlé sí ${rec}. Nọ́mbà ni ${ref}.`,
    balanceSuccess: (bal) => `Owó tó kù nínú àkọọ́lẹ̀ yín jẹ́ náírà ${bal.toLocaleString()}.`,
    insufficientFunds: (bal, req) => `Owó kò tó nínú àpò yín. Náírà ${bal.toLocaleString()} ló wà níbẹ̀, ṣùgbọ́n ẹ tọrọ náírà ${req.toLocaleString()}.`,
    didNotCatch: 'Mi ò gbọ́ ọ̀rọ̀ yín dáadáa. Ẹ jọ̀wọ́, ẹ tún sọ̀rọ̀ tàbí kí ẹ yan ọ̀kan nínú àwọn àṣàyàn wọ̀nyí.',
  },

  // Hausa
  ha: {
    balanceResponse: (bal) => `Kudin da ke cikin asusunka ya kai naira dubu ${bal.toLocaleString()}.`,
    transferConfirm: (amt, rec) => `Kuna son tura naira ${amt.toLocaleString()} zuwa ga ${rec}. Don Allah ku tabbatar.`,
    withdrawConfirm: (amt) => `Kuna son cire kudi naira ${amt.toLocaleString()}. Don Allah ku tabbatar.`,
    airtimeConfirm: (amt, rec) => `Kuna son siyan katin waya na naira ${amt.toLocaleString()} zuwa ga ${rec}. Don Allah ku tabbatar.`,
    cameraPrompt: 'Don Allah kalli kyamara don tantance fuskarka da shaidarka.',
    verifyingIdentity: 'Ana tantance shaidarku yanzu.',
    identityVerified: 'An tantance shaidarku cikin nasara. Ana aiwatar da aikin.',
    transferSuccess: (amt, rec, ref) => `An kammala aikin cikin nasara! An tura naira ${amt.toLocaleString()} ga ${rec}. Lambar aiki ita ce ${ref}.`,
    withdrawSuccess: (amt, ref) => `An cire naira ${amt.toLocaleString()} cikin nasara. Lambar ita ce ${ref}.`,
    airtimeSuccess: (amt, rec, ref) => `An tura katin waya na naira ${amt.toLocaleString()} zuwa ga ${rec}. Lambar ita ce ${ref}.`,
    balanceSuccess: (bal) => `Sauran kudin da ke cikin asusunka naira ${bal.toLocaleString()} ne.`,
    insufficientFunds: (bal, req) => `Kudin asusunka bai isa ba. Kuna da naira ${bal.toLocaleString()}, amma kuna neman naira ${req.toLocaleString()}.`,
    didNotCatch: 'Ban ji abin da kuka ce ba da kyau. Don Allah sake magana ko zabi daya daga cikin wadannan.',
  },

  // Igbo
  ig: {
    balanceResponse: (bal) => `Ego fọrọ n'ime akaụntụ gị bụ narị naira puku ${bal.toLocaleString()}.`,
    transferConfirm: (amt, rec) => `Ị chọrọ iziga naira ${amt.toLocaleString()} nye ${rec}. Biko nyochaa ma kwado.`,
    withdrawConfirm: (amt) => `Ị chọrọ iwepụ ego naira ${amt.toLocaleString()} na akaụntụ gị. Biko kwado.`,
    airtimeConfirm: (amt, rec) => `Ị chọrọ ịzụta kaadi ekwentị naira ${amt.toLocaleString()} maka ${rec}. Biko kwado.`,
    cameraPrompt: 'Biko lee anya na igwefoto ka anyị nyochaa ma mata ihu gị.',
    verifyingIdentity: 'Anyị na-enyocha njirimara ihu gị ugbu a.',
    identityVerified: 'Achọpụtala ihu gị nke ọma. Anyị na-eziga ego gị ugbu a.',
    transferSuccess: (amt, rec, ref) => `Ezila ego gị nke ọma! Ezigara naira ${amt.toLocaleString()} nye ${rec}. Nọmba ntụaka bụ ${ref}.`,
    withdrawSuccess: (amt, ref) => `Mwepụ ego naira ${amt.toLocaleString()} gara nke ọma. Nọmba bụ ${ref}.`,
    airtimeSuccess: (amt, rec, ref) => `Azụtara kaadi naira ${amt.toLocaleString()} nye ${rec} nke ọma. Nọmba bụ ${ref}.`,
    balanceSuccess: (bal) => `Ego fọrọ n'ime akaụntụ gị bụ naira ${bal.toLocaleString()}.`,
    insufficientFunds: (bal, req) => `Ego zuru oke adịghị n'akaụntụ gị. Ị nwere naira ${bal.toLocaleString()}, mana ị rịọrọ naira ${req.toLocaleString()}.`,
    didNotCatch: 'Anụghị m nke ọma. Biko kwuokwa ọzọ ma ọ bụ họrọ otu n\'ime nhọrọ ndị a.',
  },

  // Nigerian Pidgin
  pcm: {
    balanceResponse: (bal) => `Di money wey remain for your account na ₦${bal.toLocaleString()}.`,
    transferConfirm: (amt, rec) => `You wan send ₦${amt.toLocaleString()} give ${rec}. Abeg confirm am.`,
    withdrawConfirm: (amt) => `You wan collect ₦${amt.toLocaleString()} cash. Abeg confirm am.`,
    airtimeConfirm: (amt, rec) => `You wan buy ₦${amt.toLocaleString()} credit for ${rec}. Abeg confirm am.`,
    cameraPrompt: 'Abeg look inside camera make we verify your face.',
    verifyingIdentity: 'We dey verify your face now.',
    identityVerified: 'Your face match well well! We dey process your money now.',
    transferSuccess: (amt, rec, ref) => `Payment done complete well well! ₦${amt.toLocaleString()} don go give ${rec}. Reference na ${ref}.`,
    withdrawSuccess: (amt, ref) => `Cash out successful! Collect your ₦${amt.toLocaleString()}. Ref na ${ref}.`,
    airtimeSuccess: (amt, rec, ref) => `Credit recharge successful! ₦${amt.toLocaleString()} don enter ${rec} line. Ref na ${ref}.`,
    balanceSuccess: (bal) => `Di balance for your account na ₦${bal.toLocaleString()}.`,
    insufficientFunds: (bal, req) => `Your money no reach. Di money wey dey your account na ₦${bal.toLocaleString()}, but you wan send ₦${req.toLocaleString()}.`,
    didNotCatch: 'I no hear you well well. Abeg talk again or choose one of di options below.',
  },

  // English (Standard fallback)
  en: {
    balanceResponse: (bal) => `Your available balance is ₦${bal.toLocaleString()}.`,
    transferConfirm: (amt, rec) => `You want to send ₦${amt.toLocaleString()} to ${rec}. Please confirm.`,
    withdrawConfirm: (amt) => `You want to withdraw ₦${amt.toLocaleString()} in cash. Please confirm.`,
    airtimeConfirm: (amt, rec) => `You want to buy ₦${amt.toLocaleString()} airtime for ${rec}. Please confirm.`,
    cameraPrompt: 'Please look at the camera to verify your identity.',
    verifyingIdentity: 'Verifying your face biometric identity.',
    identityVerified: 'Identity verified. Processing transaction.',
    transferSuccess: (amt, rec, ref) => `Transaction successful! ₦${amt.toLocaleString()} sent to ${rec}. Reference ${ref}.`,
    withdrawSuccess: (amt, ref) => `Withdrawal successful! Please collect ₦${amt.toLocaleString()}. Reference ${ref}.`,
    airtimeSuccess: (amt, rec, ref) => `Airtime purchase of ₦${amt.toLocaleString()} for ${rec} successful. Reference ${ref}.`,
    balanceSuccess: (bal) => `Your available balance is ₦${bal.toLocaleString()}.`,
    insufficientFunds: (bal, req) => `Insufficient funds. Your available balance is ₦${bal.toLocaleString()}, but you requested ₦${req.toLocaleString()}.`,
    didNotCatch: "I didn't catch that. Please speak again or choose one of the options below.",
  },
};

/**
 * Resolves the primary spoken language code and phrases with strict priority:
 * 1. Customer account preferredLanguage (if specified on customer profile)
 * 2. Selected UI language from the dropdown
 * 3. English ('en') fallback
 */
export function getActiveLanguageCode(
  customerPreferred?: string | null,
  uiSelected?: LanguageCode | string
): LanguageCode {
  const validCodes: LanguageCode[] = ['yo', 'ha', 'ig', 'pcm', 'en'];

  if (customerPreferred && validCodes.includes(customerPreferred as LanguageCode)) {
    return customerPreferred as LanguageCode;
  }

  if (uiSelected && validCodes.includes(uiSelected as LanguageCode)) {
    return uiSelected as LanguageCode;
  }

  return 'en';
}

export function getPhrases(
  customerPreferred?: string | null,
  uiSelected?: LanguageCode | string
): { phrases: SpokenPhrases; langCode: LanguageCode } {
  const langCode = getActiveLanguageCode(customerPreferred, uiSelected);
  return {
    phrases: LOCALIZED_VOICE_PHRASES[langCode] || LOCALIZED_VOICE_PHRASES.en,
    langCode,
  };
}
