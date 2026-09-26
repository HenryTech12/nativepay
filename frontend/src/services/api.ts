import {
  BackendHealth,
  CustomerAccount,
  Language,
  Transaction,
  Bank,
  ApiResponse,
} from '../types';

/**
 * Centralized API service for NativePay frontend.
 * Always normalizes the API base URL and defaults to https://nativepay.onrender.com.
 */
export const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE as string | undefined) || 'https://nativepay.onrender.com'
).replace(/\/+$/, '');

/**
 * Cleanly constructs an absolute URL without double slashes.
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Standard HTTP helper with timeout and friendly error resolution.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    let parsedData: unknown = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      parsedData = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      parsedData = text ? { raw: text } : null;
    }

    if (!response.ok) {
      let friendlyError = "We couldn't complete that request. Please try again.";
      let technicalError = `HTTP ${response.status} ${response.statusText}`;

      if (parsedData && typeof parsedData === 'object') {
        const errObj = parsedData as Record<string, unknown>;
        if (typeof errObj.detail === 'string') {
          technicalError = errObj.detail;
          if (response.status === 404) friendlyError = 'The requested resource was not found.';
          else if (response.status === 401 || response.status === 403) friendlyError = 'Authentication check failed. Please re-verify.';
          else if (response.status === 422) friendlyError = 'Some information provided was invalid.';
        } else if (errObj.detail && typeof errObj.detail === 'object') {
          const detail = errObj.detail as Record<string, unknown>;
          technicalError = (detail.message as string) || (detail.error as string) || JSON.stringify(detail);
          if (detail.error === 'TRANSACTION_NOT_FOUND') friendlyError = 'Transaction record not found.';
          if (detail.error === 'BANKS_UNAVAILABLE') friendlyError = 'Banking network service is currently updating.';
        }
      }

      console.warn(`[NativePay API] Request failed for ${path}:`, technicalError);
      return {
        ok: false,
        error: friendlyError,
        technicalError,
      };
    }

    return {
      ok: true,
      data: parsedData as T,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[NativePay API Network Error] ${path}:`, err);

    let friendlyError = "Network connection issue. Please check your connection and try again.";
    if (err instanceof DOMException && err.name === 'AbortError') {
      friendlyError = "The request took too long to complete. Please try again.";
    }

    return {
      ok: false,
      error: friendlyError,
      technicalError: errorMsg,
    };
  }
}

// ==========================================
// API Methods
// ==========================================

export const api = {
  /**
   * Check backend health and sandbox status.
   */
  async getHealth(): Promise<ApiResponse<BackendHealth>> {
    return request<BackendHealth>('/api/health');
  },

  /**
   * Fetch supported system languages.
   */
  async getLanguages(): Promise<ApiResponse<Array<{ code: string; label: string }>>> {
    return request<Array<{ code: string; label: string }>>('/api/languages');
  },

  /**
   * Search accounts by name (e.g. for agent lookup or elderly assistance).
   */
  async searchAccounts(name: string, agentKey?: string): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    const headers: Record<string, string> = {};
    if (agentKey) headers['x-agent-key'] = agentKey;
    const query = encodeURIComponent(name.trim());
    return request<Array<{ id: string; name: string }>>(`/api/accounts/search?name=${query}`, {
      headers,
    });
  },

  /**
   * Lookup account by card number.
   */
  async getAccountByCard(cardNumber: string): Promise<ApiResponse<CustomerAccount>> {
    const cleanCard = encodeURIComponent(cardNumber.trim());
    return request<CustomerAccount>(`/api/accounts/by-card/${cleanCard}`);
  },

  /**
   * Fetch account details by account ID.
   */
  async getAccount(accountId: string, sessionToken?: string): Promise<ApiResponse<CustomerAccount>> {
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;
    return request<CustomerAccount>(`/api/accounts/${encodeURIComponent(accountId)}`, {
      headers,
    });
  },

  /**
   * Fetch customer balance.
   */
  async getAccountBalance(accountId: string): Promise<ApiResponse<{ accountId: string; balance: number; currency: string }>> {
    return request<{ accountId: string; balance: number; currency: string }>(
      `/api/accounts/${encodeURIComponent(accountId)}/balance`
    );
  },

  /**
   * Register a new customer during onboarding.
   */
  async registerAccount(data: {
    userId: string;
    fullName: string;
    address: string;
    language: string;
    email?: string;
  }, agentKey?: string): Promise<ApiResponse<CustomerAccount>> {
    const headers: Record<string, string> = {};
    if (agentKey) headers['x-agent-key'] = agentKey;
    return request<CustomerAccount>('/api/accounts/register', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        address: data.address,
        language: data.language,
        email: data.email || null,
      }),
    });
  },

  /**
   * Check if user has enrolled their face biometrics.
   */
  async getFaceStatus(userId: string): Promise<ApiResponse<{ registered: boolean }>> {
    return request<{ registered: boolean }>(`/api/face/status/${encodeURIComponent(userId)}`);
  },

  /**
   * Enroll a 128-d face descriptor vector into the backend.
   */
  async registerFace(userId: string, descriptor: number[]): Promise<ApiResponse<{ registered: boolean; userId: string }>> {
    return request<{ registered: boolean; userId: string }>('/api/face/register', {
      method: 'POST',
      body: JSON.stringify({ userId, descriptor }),
    });
  },

  /**
   * Check face descriptor match against registered profile.
   */
  async authorizeFace(userId: string, descriptor: number[]): Promise<ApiResponse<{ authorized: boolean; distance: number; threshold: number }>> {
    return request<{ authorized: boolean; distance: number; threshold: number }>('/api/face/authorize', {
      method: 'POST',
      body: JSON.stringify({ userId, descriptor }),
    });
  },

  /**
   * Start a secure customer session with a face match.
   */
  async startSession(userId: string, faceDescriptor: number[]): Promise<ApiResponse<{ sessionToken: string; account: CustomerAccount }>> {
    return request<{ sessionToken: string; account: CustomerAccount }>('/api/session/start', {
      method: 'POST',
      body: JSON.stringify({ userId, faceDescriptor }),
    });
  },

  /**
   * Get transaction history.
   */
  async getTransactions(
    userId?: string,
    sessionToken?: string,
    agentKey?: string
  ): Promise<ApiResponse<Transaction[]>> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;
    if (agentKey) headers['x-agent-key'] = agentKey;

    return request<Transaction[]>(`/api/transactions${query}`, { headers });
  },

  /**
   * Get single transaction by ID.
   */
  async getTransaction(txId: string): Promise<ApiResponse<Transaction>> {
    return request<Transaction>(`/api/transactions/${encodeURIComponent(txId)}`);
  },

  /**
   * Get formal transaction receipt.
   */
  async getTransactionReceipt(txId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return request<Record<string, unknown>>(`/api/transactions/${encodeURIComponent(txId)}/receipt`);
  },

  /**
   * Confirm an interpreted intent before execution.
   */
  async confirmTransaction(data: {
    id?: string;
    userId: string;
    action: string;
    amount: number;
    recipient: string;
    confidence?: number;
    voiceFeatureVector?: number[];
  }, sessionToken?: string): Promise<ApiResponse<Transaction>> {
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;

    return request<Transaction>('/api/transactions/confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete face verification for an existing pending transaction.
   */
  async verifyTransactionFace(data: {
    id: string;
    faceDescriptor?: number[];
    matched?: boolean;
  }, sessionToken?: string): Promise<ApiResponse<{ verified: boolean; transaction: Transaction }>> {
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;

    return request<{ verified: boolean; transaction: Transaction }>('/api/transactions/verify-face', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  },

  /**
   * Execute the finalized transaction.
   */
  async sendTransaction(id: string, sessionToken?: string): Promise<ApiResponse<{ success: boolean; transaction: Transaction }>> {
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;

    return request<{ success: boolean; transaction: Transaction }>('/api/transactions/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id }),
    });
  },

  /**
   * Cancel a pending transaction.
   */
  async cancelTransaction(txId: string, sessionToken?: string): Promise<ApiResponse<{ cancelled: boolean }>> {
    const headers: Record<string, string> = {};
    if (sessionToken) headers['x-session-token'] = sessionToken;

    return request<{ cancelled: boolean }>(`/api/transactions/${encodeURIComponent(txId)}/cancel`, {
      method: 'POST',
      headers,
    });
  },

  /**
   * Fetch Nigerian banks list.
   */
  async getBanks(): Promise<ApiResponse<Bank[]>> {
    return request<Bank[]>('/api/banks');
  },

  /**
   * Verify bank account.
   */
  async verifyBankAccount(accountNumber: string, bankCode: string): Promise<ApiResponse<{ accountName: string; accountNumber: string; bankCode: string }>> {
    return request<{ accountName: string; accountNumber: string; bankCode: string }>(
      `/api/verify-account?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`
    );
  },

  /**
   * Process raw audio recording via backend Whisper and NLP.
   */
  async processVoice(audioBlob: Blob, language?: string): Promise<ApiResponse<{
    transcription: string;
    intent: {
      action: string;
      amount?: number;
      recipient?: string;
      confidence?: number;
    };
    transaction?: Transaction;
  }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    if (language) formData.append('language', language);

    return request<{
      transcription: string;
      intent: {
        action: string;
        amount?: number;
        recipient?: string;
        confidence?: number;
      };
      transaction?: Transaction;
    }>('/api/voice/process', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Transcribe audio speech only.
   */
  async transcribeAudio(audioBlob: Blob, language?: string): Promise<ApiResponse<{ transcription: string }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    if (language) formData.append('language', language);

    return request<{ transcription: string }>('/api/transcribe', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Extract financial intent from text string using backend AI.
   */
  async extractIntent(text: string): Promise<ApiResponse<{
    action: string;
    amount?: number;
    recipient?: string;
    confidence?: number;
  }>> {
    return request<{
      action: string;
      amount?: number;
      recipient?: string;
      confidence?: number;
    }>('/api/ai/intent', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  /**
   * Synthesize audio speech (TTS).
   */
  async synthesizeSpeech(text: string, language: string = 'en'): Promise<ApiResponse<{ audioUrl?: string; audioBase64?: string }>> {
    return request<{ audioUrl?: string; audioBase64?: string }>('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text, language }),
    });
  },
};
