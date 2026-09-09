"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowWithLocale } from "@/utils/time";
import { useLanguage } from "@/context/languagecontext";

export type HorizonTxListRecord = {
  id?: string;
  hash?: string;
  successful?: boolean;
  ledger?: number;
  created_at?: string;
  source_account?: string;
  fee_charged?: string;
  operation_count?: number;
};

function shortHash(h: string) {
  if (h.length < 20) return h;
  return `${h.slice(0, 10)}…${h.slice(-6)}`;
}

export function TransactionListRow({ tx }: { tx: HorizonTxListRecord }) {
  const { language } = useLanguage();
  const hash = tx.hash || "";
  const time = tx.created_at
    ? formatDistanceToNowWithLocale(new Date(tx.created_at), language)
    : "—";

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {hash ? (
          <Link href={`/tx/${hash}`} className="text-primary hover:underline">
            {shortHash(hash)}
          </Link>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{time}</TableCell>
      <TableCell className="max-w-[200px] truncate font-mono text-xs">
        {tx.source_account ? (
          <Link href={`/account/${tx.source_account}`} className="text-primary hover:underline">
            {shortHash(tx.source_account)}
          </Link>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right text-sm">{tx.operation_count ?? "—"}</TableCell>
      <TableCell>
        {tx.successful === false ? (
          <Badge variant="destructive">Failed</Badge>
        ) : (
          <Badge variant="secondary">OK</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
