export interface A2UClaim {
  id: string;
  giftId: string;
  amount: string;
  status: string;
  paymentId: string | null;
  txid: string | null;
  error: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  gift: A2UGift;
}

export interface A2UGift {
  id: string;
  title: string;
  description: string;
  amount: string;
  memo: string;
}

export interface A2UClaimableGift extends A2UGift {
  claimable: boolean;
  status: string;
  claim: A2UClaim | null;
}

export interface A2UClaimableResponse {
  success: boolean;
  enabled: boolean;
  gifts: A2UClaimableGift[];
}

export interface A2UClaimResponse {
  success: boolean;
  alreadyCompleted: boolean;
  claim: A2UClaim;
}

export class A2UApiError extends Error {
  public readonly status: number;
  public readonly data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    const message = typeof data.error === 'string' ? data.error : typeof data.message === 'string' ? data.message : `HTTP ${status}`;
    super(message);
    this.name = 'A2UApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pi_access_token') : null;
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });
  let data: Record<string, unknown> = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!response.ok) throw new A2UApiError(response.status, data);
  return data as T;
}

export const a2uAPI = {
  getClaimable: () => request<A2UClaimableResponse>('/api/pi/payments/claimable'),
  claimGift: (giftId: string) => request<A2UClaimResponse>('/api/pi/payments/claim', {
    method: 'POST',
    body: JSON.stringify({ giftId }),
  }),
};

export const a2uApi = a2uAPI;
export default a2uAPI;
