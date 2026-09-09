import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryStat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface SummaryStatsProps {
  stats: SummaryStat[];
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="flex items-center gap-3 p-4 sm:p-5">
            {stat.icon && (
              <div className="rounded-full p-2.5 bg-emerald-100 dark:bg-emerald-900/20 shrink-0">
                {stat.icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold text-foreground truncate">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
