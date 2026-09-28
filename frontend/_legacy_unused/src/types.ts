export type Action = "send" | "balance" | "withdraw" | "deposit" | "airtime" | "bill" | "unknown";

export type TransactionState =
  | "INTENT_DETECTED"
  | "COLLECTING_DETAILS"
  | "CONFIRMATION_REQUIRED"
  | "USER_CONFIRMED"
  | "FACE_VERIFICATION_REQUIRED"
  | "FACE_VERIFIED"
  | "TRANSACTION_PROCESSING"
  | "TRANSACTION_SUCCESS"
  | "USER_CANCELLED"
  | "INVALID_AMOUNT"
  | "INSUFFICIENT_FUNDS"
  | "UNKNOWN_RECIPIENT"
  | "LOW_AI_CONFIDENCE"
  | "TRANSACTION_FAILED"
  | "FACE_VERIFICATION_FAILED"
  | "BMONI_API_ERROR";

export interface ParsedIntent {
  action: Action;
  amount: number | null;
  recipient: string | null;
  confidence: number;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  action: Action;
  amount: number | null;
  recipient: string | null;
  recipientAccount: string | null;
  confidence: number | null;
  state: TransactionState;
  createdAt: string;
  faceVerified: boolean;
  verificationMethod?: "face" | "voice" | null;
  bmoniReference: string | null;
  error: string | null;
  needsClarification?: "amount" | "recipient" | "accountNumber";
}

export interface Receipt {
  transactionId: string;
  type: Action;
  amount: number | null;
  recipient: string | null;
  reference: string | null;
  status: TransactionState;
  date: string;
  environment: string;
}

export interface Language {
  code: string;
  label: string;
}

export interface AccountProfile {
  id: string;
  name: string;
  preferredLanguage: string;
  balance: number;
  address: string | null;
  email: string | null;
  cardNumber: string | null;
}

export interface AccountRegisterPayload {
  userId: string;
  fullName: string;
  address: string;
  email: string;
  language: string;
}

export interface VoiceStatus {
  registered: boolean;
}

export interface VoiceAuthorizeResult {
  authorized: boolean;
  similarity?: number;
  threshold?: number;
  reason?: string;
}

export interface FaceStatus {
  registered: boolean;
}

export interface FaceAuthorizeResult {
  authorized: boolean;
  distance?: number;
  threshold?: number;
  reason?: string;
}

export interface Bank {
  name: string;
  code: string;
}

export interface HealthStatus {
  ok: boolean;
  demoMode: boolean;
  bmoniMockMode: boolean;
  dbConnected: boolean;
}

export interface AgentBmoniProfile {
  bmoniUserId: string | null;
  bmoniSmartWalletId: string | null;
  bmoniWalletAddress: string | null;
  bmoniWithdrawalAccountId: string | null;
  bmoniOnboarded: boolean;
}
