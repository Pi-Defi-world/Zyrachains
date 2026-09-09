"use client";

import { useState, useCallback } from "react";
import ContractsTab from "@/components/tabs/ContractsTab";
import { PageHeader } from "@/components/PageHeader";
import { SummaryStats } from "@/components/SummaryStats";
import { FileCode, Users, Clock, Layers } from "lucide-react";

interface Contract {
  id: string;
  admin?: string;
  last_modified_ledger?: number;
}

interface ContractsApiResponse {
  _embedded: { records: Contract[] };
}

export default function Contracts() {
  const [stats, setStats] = useState({ total: 0, withAdmin: 0, latestLedger: 0 });
  const [initialLoading, setInitialLoading] = useState(true);

  const handleLoad = useCallback((data: ContractsApiResponse, isInitial: boolean) => {
    if (isInitial) {
      const records = data._embedded?.records || [];
      const total = records.length;
      const withAdmin = records.filter(c => !!c.admin).length;
      const latestLedger = records.reduce((max, c) => Math.max(max, c.last_modified_ledger || 0), 0);
      setStats({ total, withAdmin, latestLedger });
    }
    setInitialLoading(false);
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Smart Contracts"
        description="Browse smart contracts deployed on the Zyrachain network — view contract details, administrators, and activity."
      >
        {!initialLoading && (
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {stats.total} contracts
          </div>
        )}
      </PageHeader>

      {!initialLoading && (
        <SummaryStats
          stats={[
            { label: "Total Contracts", value: stats.total.toLocaleString(), icon: <FileCode className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            { label: "With Admin", value: stats.withAdmin.toLocaleString(), icon: <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
            { label: "Latest Ledger", value: stats.latestLedger.toLocaleString(), icon: <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> },
          ]}
        />
      )}

      <ContractsTab onLoad={handleLoad} />
    </div>
  );
}
