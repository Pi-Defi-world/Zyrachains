import { fetchSnapshot } from '@/lib/server-fetch';
import { LiveHeroGrid } from './LiveHeroGrid';

type HeroPayload = {
  priceUsd: number;
  total_circulating_supply: number;
  total_supply: number;
  total_locked: number;
  latest_block: number;
  tps: number;
  market_cap_usd?: number;
};

export async function HomeHeroSection() {
  const res = await fetchSnapshot<HeroPayload>('hero', 10);
  if (!res.success || !res.data) {
    return (
      <section className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
        Market overview temporarily unavailable. Ensure the API server is running and snapshots have warmed.
      </section>
    );
  }

  return <LiveHeroGrid initial={{ ...res.data, updatedAt: res.updatedAt }} />;
}
