'use client';

export class PiAdsService {
  static isPiBrowser(): boolean {
    return typeof window !== 'undefined' && !!(window as any).Pi;
  }

  static async isAdSupported(): Promise<boolean> {
    if (!this.isPiBrowser()) return false;
    try {
      await (window as any).Pi.init({ version: '2.0' });
      const features = await (window as any).Pi.nativeFeaturesList?.();
      return Array.isArray(features) && features.includes('ad_network');
    } catch {
      return false;
    }
  }

  static async showInterstitialAd(): Promise<boolean> {
    if (!this.isPiBrowser()) return false;
    try {
      const result = await (window as any).Pi.Ads?.showAd?.('interstitial');
      return result?.result === 'AD_CLOSED';
    } catch {
      return false;
    }
  }

  static async showRewardedAd(): Promise<{ adId: string; rewarded: boolean } | null> {
    if (!this.isPiBrowser()) return null;
    try {
      const isReady = await (window as any).Pi.Ads?.isAdReady?.('rewarded');
      if (!isReady?.ready) {
        const reqResult = await (window as any).Pi.Ads?.requestAd?.('rewarded');
        if (reqResult?.result !== 'AD_LOADED') return null;
      }
      const result = await (window as any).Pi.Ads?.showAd?.('rewarded');
      if (result?.result === 'AD_REWARDED') {
        return { adId: result.adId, rewarded: true };
      }
      return null;
    } catch {
      return null;
    }
  }

  static async verifyRewardedAd(adId: string, accessToken: string): Promise<boolean> {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/social/ads/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ adId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.success && data.granted;
      }
      return false;
    } catch {
      return false;
    }
  }
}
