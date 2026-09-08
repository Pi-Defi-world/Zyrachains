'use client';

const PI_STORAGE_AVAILABLE_KEY = 'zyra_pi_storage_available';

async function checkPiStorageAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (!(window as any).Pi) return false;
    await (window as any).Pi.init({ version: '2.0' });
    return typeof (window as any).Pi.localStorage === 'object';
  } catch {
    return false;
  }
}

function isPiStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PI_STORAGE_AVAILABLE_KEY) === 'true';
  } catch {
    return false;
  }
}

async function ensurePiStorageCheck(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(PI_STORAGE_AVAILABLE_KEY) !== null) return;
  const available = await checkPiStorageAvailable();
  localStorage.setItem(PI_STORAGE_AVAILABLE_KEY, available ? 'true' : 'false');
}

export const piLocalStorage = {
  async getItem(key: string): Promise<string | null> {
    await ensurePiStorageCheck();
    if (isPiStorageAvailable()) {
      try {
        return await (window as any).Pi.localStorage.getItem(key);
      } catch {}
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await ensurePiStorageCheck();
    if (isPiStorageAvailable()) {
      try {
        await (window as any).Pi.localStorage.setItem(key, value);
        return;
      } catch {}
    }
    try {
      localStorage.setItem(key, value);
    } catch {}
  },

  async removeItem(key: string): Promise<void> {
    await ensurePiStorageCheck();
    if (isPiStorageAvailable()) {
      try {
        await (window as any).Pi.localStorage.removeItem(key);
        return;
      } catch {}
    }
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  async clear(): Promise<void> {
    await ensurePiStorageCheck();
    if (isPiStorageAvailable()) {
      try {
        await (window as any).Pi.localStorage.clear();
        return;
      } catch {}
    }
    try {
      localStorage.clear();
    } catch {}
  },
};
