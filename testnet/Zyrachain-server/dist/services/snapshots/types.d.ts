export interface HomeHeroPayload {
    priceUsd: number;
    confidenceScore?: number;
    high24hUsd?: number;
    low24hUsd?: number;
    open24hUsd?: number;
    priceChange24h?: number;
    total_circulating_supply: number;
    total_locked: number;
    total_supply: number;
    market_cap_usd: number;
    fdv_usd: number;
    latest_block: number;
    tps: number;
    horizon_ingest_latest_ledger?: number;
    source_prices?: Record<string, {
        price: number;
        weight?: number;
        timestamp?: string;
    }>;
    updatedAt: string;
}
export interface LedgerSummary {
    id?: string;
    sequence?: number;
    successful_transaction_count?: number;
    operation_count?: number;
    closed_at?: string;
    total_coins?: string;
}
export interface LatestBlocksPayload {
    records: LedgerSummary[];
    nextCursor?: string | null;
    prevCursor?: string | null;
    horizonLinks?: Record<string, unknown>;
    updatedAt: string;
}
export interface HorizonEmbedded<T> {
    _embedded?: {
        records: T[];
    };
    _links?: Record<string, {
        href?: string;
    }>;
}
export interface HomePulsePayload {
    netChange24hCoreTeam: number;
    netChange24hCex: number;
    largestMoves24h: Array<{
        wallet: string;
        change: number;
        detectedAt: string;
        oldBalance?: number;
        newBalance?: number;
    }>;
    updatedAt: string;
}
export interface TopWalletRow {
    identifier: string;
    name: string;
    category: 'CEX' | 'Core Team' | 'Generated';
    balance: number | null;
    lastCheckedAt?: string | null;
}
export interface TopWalletsPayload {
    wallets: TopWalletRow[];
    updatedAt: string;
}
export interface CexFlowRow {
    identifier: string;
    name: string;
    net24h: number;
    in24h: number;
    out24h: number;
}
export interface CexFlowsPayload {
    flows: CexFlowRow[];
    updatedAt: string;
}
export interface LatestOpsPayload {
    records: unknown[];
    horizonLinks?: Record<string, unknown>;
    updatedAt: string;
}
export interface LatestTransactionsPayload {
    records: unknown[];
    horizonLinks?: Record<string, unknown>;
    updatedAt: string;
}
export interface AssetsPoolsPayload {
    assets: HorizonEmbedded<unknown>;
    pools: HorizonEmbedded<unknown>;
    updatedAt: string;
}
export interface EcosystemLeaderboardsPayload {
    communities: Record<string, unknown>[];
    influencers: Record<string, unknown>[];
    socialStats: boolean;
    updatedAt: string;
}
//# sourceMappingURL=types.d.ts.map