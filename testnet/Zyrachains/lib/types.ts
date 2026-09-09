export interface Business {
  _id: string;
  name: string;
  description: string;
  category: string;
  totalHoldings: number;
  walletAddress: string;
  founders: string[];
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  lastUpdated: string;
  status: 'active' | 'inactive';
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  netPiChange24h: number;
  logo?: string;
  rank: number;
}
