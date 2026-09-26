export type LanguageCode = 'en' | 'pcm' | 'yo' | 'ha' | 'ig';

export interface Language {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  greeting: string;
  tagline: string;
  speechCode: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  preferredLanguage: string;
  balance: number;
  cardNumber?: string | null;
  address?: string | null;
  email?: string | null;
  createdAt?: string;
}

export type TransactionAction = 'transfer' | 'withdraw' | 'airtime' | 'balance' | 'deposit';

export type TransactionStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  userId?: string | null;
  action: TransactionAction;
  amount: number;
  recipient?: string | null;
  recipientAccount?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  status: TransactionStatus;
  createdAt: string;
  reference: string;
  confidence?: number | null;
  narration?: string | null;
  failureReason?: string | null;
}

export interface TransactionIntent {
  action: TransactionAction;
  // Nullable: extraction can genuinely fail to find an amount/recipient in
  // the spoken command. Callers must check `needsClarification` before
  // treating amount/recipient as safe to execute against.
  amount: number | null;
  recipient: string | null;
  recipientAccount?: string;
  bankName?: string;
  bankCode?: string;
  confidence: number;
  rawText: string;
  suggestedNarration?: string;
  // Set when the parsed command is missing information required to safely
  // proceed, or when the recipient couldn't be confidently resolved.
  needsClarification?: 'amount' | 'recipient' | 'recipient_not_found' | 'recipient_ambiguous';
  // Populated when needsClarification === 'recipient_ambiguous'.
  recipientCandidates?: string[];
}

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'understanding'
  | 'confirming'
  | 'verifying'
  | 'transacting'
  | 'success'
  | 'error';

export type FaceVerificationState =
  | 'idle'
  | 'ready'
  | 'camera_loading'
  | 'detecting'
  | 'verifying'
  | 'verified'
  | 'failed'
  | 'retry';

export type AppViewMode =
  | 'landing'
  | 'customer-home'
  | 'customer-balance'
  | 'customer-history'
  | 'pos-agent'
  | 'onboarding';

export interface Bank {
  code: string;
  name: string;
}

export interface BackendHealth {
  ok: boolean;
  environment?: string;
  demoMode: boolean;
  bmoniMockMode?: boolean;
  aiProvider?: string;
  dbConnected?: boolean;
  authRequired?: boolean;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  technicalError?: string;
}
