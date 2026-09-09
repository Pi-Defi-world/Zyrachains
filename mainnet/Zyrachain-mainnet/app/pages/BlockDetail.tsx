"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { horizon } from "../../api/horizon";
import { usePageMetadata } from "@/context/pagemetadataContext";
import CopyIcon from "@/components/copyIcon";
import OperationText from "@/components/operationtext";
import { okx } from "../../api/okx";
import { timelib } from "@/utils/time"; 
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/languagecontext";

interface BlockDetailProps {
  sequence: string;
}

const BlockDetail: React.FC<BlockDetailProps> = ({ sequence }) => {
  const { t, language } = useLanguage();
  const [blockData, setBlockData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [effects, setEffects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  //
  const [txNextLink, setTxNextLink] = useState("");
  const [txPrevLink, setTxPrevLink] = useState("");
  const [txPage, setTxPage] = useState(1);

  const [opNextLink, setOpNextLink] = useState("");
  const [opPrevLink, setOpPrevLink] = useState("");
  const [opPage, setOpPage] = useState(1);

  const [efNextLink, setEfNextLink] = useState("");
  const [efPrevLink, setEfPrevLink] = useState("");
  const [efPage, setEfPage] = useState(1);
  const [piPriceUSD, setPiPriceUSD] = useState(0.0);
  //
  const { setHeading, setTitle, setDescription } = usePageMetadata();

  // Format amount with language support
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(language, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 3 
    });
  };

  const fetchPiPrice = async () => {
    try {
      okx.getMarketData().then(marketData => {
        // Market Stats
        setPiPriceUSD(parseFloat(marketData.idxPx));
      })
    } catch (error) {
      console.error("Error fetching Pi price:", error);
    }
  };

  useEffect(() => {
    fetchPiPrice();
  }, []);

  useEffect(() => {
    // Use translations with template variables
    const translatedTitle = String(t('block.title')).replace('{{sequence}}', sequence || '');
    const translatedHeading = String(t('block.heading')).replace('{{sequence}}', sequence || '');
    const translatedDescription = String(t('block.description')).replace('{{sequence}}', sequence || '');
    
    setTitle(translatedTitle);
    setHeading(translatedHeading);
    setDescription(translatedDescription);
    
    // Update metadata immediately
    document.title = translatedTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", translatedDescription);
  }, [sequence, setTitle, setDescription, setHeading, t, language]);

  // Fetch block detail from API
  const fetchBlockDetail = async () => {
    try {
      setLoading(true);
      if (sequence) {
        const response = await horizon.getLedgerBySequence(parseInt(sequence));
        setBlockData(response);
      } else {
        setBlockData(null);
      }
    } catch (error) {
      console.error("Error fetching block detail:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated tab data
  const fetchTransactions = async (Link = "", page = 1) => {
    try {
      setTabLoading(true);
      const response = await horizon.getTransactions(sequence || "", Link);
      //if order asc, reverse the array, and next is prev and prev is next
      if (Link == "" || Link.indexOf("order=desc") > 0) {
        setTransactions(response._embedded.records);
        setTxNextLink(response._links.next.href);
        setTxPrevLink(response._links.prev.href);
        setTxPage(page);
      }
      else {
        setTransactions(response._embedded.records.reverse());
        setTxNextLink(response._links.prev.href);
        setTxPrevLink(response._links.next.href);
        setTxPage(page);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchOperations = async (Link = "", page = 1) => {
    try {
      setTabLoading(true);
      const response = await horizon.getOperations(sequence || "", Link);
      //if order asc, reverse the array, and next is prev and prev is next
      if (Link == "" || Link.indexOf("order=desc") > 0) {
        setOperations(response._embedded.records);
        setOpNextLink(response._links.next.href);
        setOpPrevLink(response._links.prev.href);
        setOpPage(page);
      }
      else {
        setOperations(response._embedded.records.reverse());
        setOpNextLink(response._links.prev.href);
        setOpPrevLink(response._links.next.href);
        setOpPage(page);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchEffects = async (Link = "", page = 1) => {
    try {
      setTabLoading(true);
      const response = await horizon.getEffects(sequence || "", Link);
      //if order asc, reverse the array, and next is prev and prev is next
      if (Link == "" || Link.indexOf("order=desc") > 0) {
        setEffects(response._embedded.records);
        setEfNextLink(response._links.next.href);
        setEfPrevLink(response._links.prev.href);
        setEfPage(page);
      }
      else {
        setEffects(response._embedded.records.reverse());
        setEfNextLink(response._links.prev.href);
        setEfPrevLink(response._links.next.href);
        setEfPage(page);
      }
    } catch (error) {
      console.error("Error fetching effects:", error);
    } finally {
      setTabLoading(false);
    }
  };

  // Fetch transactions, operations, effects
  const fetchTabData = async () => {
    try {
      setTabLoading(true);
      if (sequence) {
        fetchTransactions("", 1);
        fetchOperations("", 1);
        fetchEffects("", 1);
      }
    } catch (error) {
      console.error("Error fetching tab data:", error);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockDetail();
    fetchTabData();
  }, [sequence]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner />
        <p>{t('block.loading')}</p>
      </div>
    );
  }

  if (!blockData) {
      return <p className="text-center text-red-500">{t('block.not_found')}</p>;
  }

  return (
    <div className="white-zone">
      <h2 className="mb-4">{String(t('block.heading')).replace('{{sequence}}', blockData.sequence.toString())}</h2>

      {/* Block Information */}
      <h5>{t('block.information')}</h5>
      <div className="w-full overflow-auto">
        <table className="w-full">
          <tbody>
            <tr>
              <th>{t('block.hash')}</th>
              <td>{blockData.hash} {" "}<CopyIcon textToCopy={blockData.hash} /></td>
            </tr>
            <tr>
              <th>{t('block.previous_hash')}</th>
              <td>
                <Link className="text-decoration-none" href={`/block/${blockData.sequence - 1}`}>
                  {blockData.prev_hash}
                </Link>{" "}
                <CopyIcon textToCopy={blockData.prev_hash} />
              </td>
            </tr>
            <tr>
              <th>{t('block.sequence')}</th>
              <td>{blockData.sequence}</td>
            </tr>
            <tr>
              <th>{t('block.time')}</th>
              <td>{timelib.timeAgo(blockData.closed_at, language)}</td>
            </tr>
            <tr>
              <th>{t('block.total_coins')}</th>
              <td>{formatAmount(parseFloat(blockData.total_coins))} π</td>
            </tr>
            <tr>
              <th>{t('block.fee_pool')}</th>
              <td>{formatAmount(parseFloat(blockData.fee_pool))} π</td>
            </tr>
            <tr>
              <th>{t('block.base_fee')}</th>
              <td>{formatAmount(blockData.base_fee_in_stroops / 10000000)} π</td>
            </tr>
            <tr>
              <th>{t('block.base_reserve')}</th>
              <td>{formatAmount(blockData.base_reserve_in_stroops / 10000000)} π</td>
            </tr>
            <tr>
              <th>{t('block.protocol_version')}</th>
              <td>{blockData.protocol_version}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabs for Transactions, Operations, Effects */}
      <Tabs defaultValue="transactions" className="mt-4">
        <TabsList>
          <TabsTrigger value="transactions">{t('block.tabs.transactions')}</TabsTrigger>
          <TabsTrigger value="operations">{t('block.tabs.operations')}</TabsTrigger>
          <TabsTrigger value="effects">{t('block.tabs.effects')}</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          {tabLoading ? (
            <div className="flex justify-center mt-3">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('block.tx_hash')}</TableHead>
                      <TableHead>{t('operations.source_account')}</TableHead>
                      <TableHead>{t('block.operation_count')}</TableHead>
                      <TableHead>{t('block.fee')}</TableHead>
                      <TableHead>{t('block.created_at')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Link href={`/tx/${tx.hash}`} className="hover:underline">
                            {tx.hash.slice(0, 16)}...
                          </Link>
                          {" "}
                          <CopyIcon textToCopy={tx.hash} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/account/${tx.source_account}`} className="hover:underline">
                            {tx.source_account.slice(0, 8)}...{tx.source_account.slice(-8)}
                          </Link>
                          {" "}
                          <CopyIcon textToCopy={tx.source_account} />
                        </TableCell>
                        <TableCell>{tx.operation_count}</TableCell>
                        <TableCell>{formatAmount(tx.fee_charged / 10_000_000)} π</TableCell>
                        <TableCell>{timelib.timeAgo(tx.created_at, language)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchTransactions(txPrevLink, txPage - 1)}
                  disabled={!txPrevLink || tabLoading || txPage === 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="mx-3">{t('pagination.page')} {txPage}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchTransactions(txNextLink, txPage + 1)}
                  disabled={!txNextLink || tabLoading}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="operations">
          {tabLoading ? (
            <div className="flex justify-center mt-3">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('operations.source_account')}</TableHead>
                      <TableHead>{t('operations.operation')}</TableHead>
                      <TableHead>{t('operations.amount')}</TableHead>
                      <TableHead>{t('operations.tx')}</TableHead>
                      <TableHead>{t('operations.time')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          <Link href={`/account/${op.source_account}`} className="hover:underline">
                            {op.source_account.slice(0, 8)}...{op.source_account.slice(-8)}
                          </Link>
                          {" "}
                          <CopyIcon textToCopy={op.source_account} />
                        </TableCell>
                        <TableCell><OperationText op={op} PiPrice={piPriceUSD} /></TableCell>
                        <TableCell className="font-medium">
                          {op.amount ? formatAmount(parseFloat(op.amount)) : ""}
                        </TableCell>
                        <TableCell>
                          <Link href={`/tx/${op.transaction_hash}`} className="hover:underline">
                            {op.transaction_hash.slice(0, 16)}...
                          </Link>
                          {" "}
                          <CopyIcon textToCopy={op.transaction_hash} />
                        </TableCell>
                        <TableCell>{timelib.timeAgo(op.created_at, language)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchOperations(opPrevLink, opPage - 1)}
                  disabled={!opPrevLink || tabLoading || opPage === 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="mx-3">{t('pagination.page')} {opPage}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchOperations(opNextLink, opPage + 1)}
                  disabled={!opNextLink || tabLoading}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="effects">
          {tabLoading ? (
            <div className="flex justify-center mt-3">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('account.account')}</TableHead>
                      <TableHead>{t('account.effect')}</TableHead>
                      <TableHead>{t('operations.amount')}</TableHead>
                      <TableHead>{t('operations.time')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effects.map((effect) => (
                      <TableRow key={effect.id}>
                        <TableCell>
                          <Link href={`/account/${effect.account}`} className="hover:underline">
                            {effect.account.slice(0, 8)}...{effect.account.slice(-8)}
                          </Link>
                          {" "}
                          <CopyIcon textToCopy={effect.account} />
                        </TableCell>
                        <TableCell>{t(`effects.${effect.type}`) || effect.type.split("_").join(" ")}</TableCell>
                        <TableCell className="font-medium">
                          <span className={
                            effect.type == "account_credited" ? "text-green-600" : 
                            effect.type == "account_debited" ? "text-red-600" : "text-muted-foreground"
                          }>
                            {effect.type == "account_debited" ? "-" : effect.type == "account_credited" ? "+" : ""}
                            {effect.amount ? formatAmount(parseFloat(effect.amount)) : ""}
                          </span>
                        </TableCell>
                        <TableCell>{timelib.timeAgo(effect.created_at, language)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchEffects(efPrevLink, efPage - 1)}
                  disabled={!efPrevLink || tabLoading || efPage === 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="mx-3">{t('pagination.page')} {efPage}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchEffects(efNextLink, efPage + 1)}
                  disabled={!efNextLink || tabLoading}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockDetail;