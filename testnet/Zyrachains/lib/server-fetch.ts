import { getBackendUrl } from './get-backend-url';

export type SnapshotResponse<T = unknown> = {
  success: boolean;
  data?: T;
  updatedAt?: string;
  error?: string;
};

export async function fetchSnapshot<T = unknown>(
  segment: string,
  revalidateSeconds = 10
): Promise<SnapshotResponse<T>> {
  try {
    const base = getBackendUrl();
    const url = `${base}/api/v2/home/${encodeURIComponent(segment)}`;
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds, tags: [`home-${segment}`] },
    });
    
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    
    const json = (await res.json()) as SnapshotResponse<T>;
    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
