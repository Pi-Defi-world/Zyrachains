"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { horizon } from "../../api/horizon";
import { usePageMetadata } from "@/context/pagemetadataContext";
import CopyIcon from "@/components/copyIcon";
import OperationText from "@/components/operationtext";
import { okx } from "../../api/okx";
import { timelib } from "../../utils/time";
import AccountLabel from "@/components/AccountLabel";
import { describePredicate, getUnlockTime } from "../../utils/predicate";
import { useLanguage } from "@/context/languagecontext";
import { LabledAddress } from "../../utils/addresses";
import { ArrowLeft, Clock, Lock, Gift, Wallet, ArrowRight } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

interface AccountDetailProps {
  address: string;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ address }) => {
  const { language, t } = useLanguage();
  const [accountData, setAccountData] = useState<any>(null);
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
  //
  const [piPriceUSD, setPiPriceUSD] = useState(0.0);
  //
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  //
  const [claimableBalance, setClaimableBalance] = useState<any>();
  const [totalLocking, setTotalLocking] = useState(0);
  const [lockingItemCount, setLockingItemCount] = useState(0);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [nextUnlockTime, setNextUnlockTime] = useState("");
  const [claimableItemCount, setClaimableItemCount] = useState(0);

  useEffect(() => {
    const translatedTitle = String(t('account.title')).replace('{{address}}', address || '');
    const translatedHeading = String(t('account.heading_with_address')).replace('{{address}}', address || '');
    const translatedDescription = String(t('account.description')).replace('{{address}}', address || '');
    
    setTitle(translatedTitle);
    setHeading(translatedHeading);
    setDescription(translatedDescription);
    
    document.title = translatedTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", translatedDescription);
  }, [address, setTitle, setDescription, setHeading, language, t]);

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString(language, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString(language, { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const fetchPiPrice = async () => {
    try {
      okx.getMarketData().then(marketData => {
        setPiPriceUSD(parseFloat(marketData.idxPx));
      });
    } catch (error) {
      console.error("Error fetching Pi price:", error);
    }
  };

  useEffect(() => {
    fetchPiPrice();
  }, []);

  const fetchAccountDetail = async () => {
    try {
      setLoading(true);
      if (address) {
        const response = await horizon.getAccountDetails(address);
        setAccountData(response);
        const translatedTitle = t('account.title')+address;
        setTitle(translatedTitle);
        setHeading(t('account.heading_with_address')+ address );
        setDescription(t('account.description')+ address );
      } else {
        setAccountData(null);
      }
    } catch (error: any) {
      if (error?.response?.status !== 400 && error?.response?.status !== 404) {
        console.error("Error fetching Account detail:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (Link = "", page = 1) => {
    try {
      setTabLoading(true);
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
      const response = await horizon.getTransactions("", Link!=""?Link:`${horizonUrl}/accounts/${address}/transactions?limit=10&order=desc`);
      if (Link==""||Link.indexOf("order=desc") > 0) {
        setTransactions(response._embedded.records);
        setTxNextLink(response._links.next.href);
        setTxPrevLink(response._links.prev.href);
        setTxPage(page);
      }
      else{
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
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
      const response = await horizon.getOperations("", Link!=""?Link:`${horizonUrl}/accounts/${address}/operations?limit=10&order=desc`);
       if (Link==""||Link.indexOf("order=desc") > 0) {
      setOperations(response._embedded.records);
      setOpNextLink(response._links.next.href);
      setOpPrevLink(response._links.prev.href);
      setOpPage(page);
    }
    else{
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
      const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
      const response = await horizon.getEffects(address||"", Link!=""?Link:`${horizonUrl}/accounts/${address}/effects?limit=10&order=desc`);
       if (Link==""||Link.indexOf("order=desc") > 0) {
      setEffects(response._embedded.records);
      setEfNextLink(response._links.next.href);
      setEfPrevLink(response._links.prev.href);
      setEfPage(page);
    }
    else{
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
  const fecthClaimableBalance = () => {
    try {
      horizon.getClaimableBalances(address||"").then(response=>{
        setClaimableBalance(response._embedded.records);
        //
        let locking=0;
        let lockingCount=0;
        let claimable=0;
        let nextUnlock=0;
        let claimableCount=0;
        for (let i = 0; i < response._embedded.records.length; i++) {
          const element = response._embedded.records[i];
          const claimt=element.claimants.find((c: any) => c.destination == address);
          if (claimt) {
            const unlockTime=getUnlockTime(claimt.predicate,element.last_modified_time);
            if (unlockTime>0) {
              locking+=parseFloat(element.amount);
              lockingCount++;
              if (nextUnlock==0||nextUnlock>unlockTime) {
                nextUnlock=unlockTime;
              }
            }
            else{
              claimable+=parseFloat(element.amount);
              claimableCount++;
            }
          }
        }
        setTotalLocking(locking);
        setTotalClaimable(claimable);
        setLockingItemCount(lockingCount);
        setClaimableItemCount(claimableCount);
        if (nextUnlock>0) {
          const unlockDate=new Date(Date.now() + Math.round(nextUnlock)*1000).toUTCString();
          setNextUnlockTime(unlockDate);
        }
      })
    } catch (error) {
      console.error("Error fetching claimable balance:", error);
    }
  };
    const fetchTabData = async () => {
      try {
        setTabLoading(true);
        if (address) {
         fetchTransactions("",1);
         fetchOperations("",1);
         fetchEffects("",1);
        }
      } catch (error) {
        console.error("Error fetching tab data:", error);
      } finally {
        setTabLoading(false);
      }
    };
    useEffect(() => {
      fetchAccountDetail();
      fetchTabData();
      fecthClaimableBalance();
    }, [address]);

    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('account.loading')}</p>
          </div>
        </div>
      );
    }

    if (!accountData) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-destructive text-lg">{t('account.not_found')}</p>
        </div>
      );
    }

    const labeled = address != null && LabledAddress[address] != null ? LabledAddress[address] : null;

    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>

          {/* Address Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-mono font-semibold text-foreground break-all">
                {address}
              </h1>
              <CopyIcon textToCopy={address || ""} />
              {labeled && (
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                  {labeled.Logo && (
                    <img src={labeled.Logo} alt={labeled.Name} className="h-4 w-4 rounded-full" />
                  )}
                  {labeled.Name}
                </Badge>
              )}
            </div>
            <FavoriteButton
              id={address}
              type="account"
              label={`${address.slice(0, 12)}...${address.slice(-8)}`}
              detail={accountData?.balances?.[0] ? `Balance: ${formatAmount(parseFloat(accountData.balances[0].balance))} PI` : undefined}
              href={`/account/${address}`}
              size="sm"
            />
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="card-glow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('account.overview')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('account.available_balance')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(parseFloat(accountData.balances[0].balance))}
                      <span className="text-sm font-medium text-muted-foreground ml-1">π</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(parseFloat(accountData.balances[0].balance) * piPriceUSD)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {t('account.last_modified_time')}: {timelib.timeFormat(accountData.last_modified_time, language)}
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('account.locking')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {String(t('account.total_locking')).replace('{{count}}', lockingItemCount.toString())}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(totalLocking)}
                      <span className="text-sm font-medium text-muted-foreground ml-1">π</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalLocking * piPriceUSD)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {t('account.next_unlock_time')}: {nextUnlockTime !== "" ? timelib.timeFormat(nextUnlockTime, language) : "—"}
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('account.claimable')}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('account.amount')}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(totalClaimable)}
                      <span className="text-sm font-medium text-muted-foreground ml-1">π</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(totalClaimable * piPriceUSD)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center text-xs text-muted-foreground">
                  <span>{t('account.number_of_items')}: {claimableItemCount == 100 ? t('account.over_100_items') : formatAmount(claimableItemCount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="operations">
            <TabsList className="mb-6">
              <TabsTrigger value="operations">{t('account.tabs.operations')}</TabsTrigger>
              <TabsTrigger value="transactions">{t('account.tabs.transactions')}</TabsTrigger>
              <TabsTrigger value="effects">{t('account.tabs.effects')}</TabsTrigger>
              <TabsTrigger value="claimables">{t('account.tabs.claimable_balances')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="operations">
              {tabLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                      {operations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No operations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        operations.map((op) => (
                          <TableRow key={op.id}>
                            <TableCell>
                              <AccountLabel account={op.source_account} shorten={true} />
                            </TableCell>
                            <TableCell><OperationText op={op} PiPrice={piPriceUSD} /></TableCell>
                            <TableCell className="font-medium">
                              {op.amount ? formatAmount(parseFloat(op.amount)) : ""}
                            </TableCell>
                            <TableCell>
                              <Link href={`/tx/${op.transaction_hash}`} className="text-primary hover:underline font-mono text-sm">
                                {op.transaction_hash.slice(0, 16)}...
                              </Link>
                              {" "}
                              <CopyIcon textToCopy={op.transaction_hash} />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{timelib.timeAgo(op.created_at, language)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchOperations(opPrevLink, opPage - 1)}
                      disabled={!opPrevLink || tabLoading || opPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      {t('pagination.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">{t('pagination.page')} {opPage}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchOperations(opNextLink, opPage + 1)}
                      disabled={!opNextLink || tabLoading}
                    >
                      {t('pagination.next')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="transactions">
              {tabLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('account.tx_hash')}</TableHead>
                        <TableHead>{t('operations.source_account')}</TableHead>
                        <TableHead>{t('account.operation_count')}</TableHead>
                        <TableHead>{t('account.fee')}</TableHead>
                        <TableHead>{t('account.created_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <Link href={`/tx/${tx.id}`} className="text-primary hover:underline font-mono text-sm">
                                {tx.id.slice(0, 16)}...
                              </Link>
                              {" "}
                              <CopyIcon textToCopy={tx.id} />
                            </TableCell>
                            <TableCell>
                              <AccountLabel account={tx.source_account} shorten={true} />
                            </TableCell>
                            <TableCell>{tx.operation_count}</TableCell>
                            <TableCell className="font-mono">{(tx.fee_charged / 10_000_000).toFixed(2)} π</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{timelib.timeAgo(tx.created_at, language)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchTransactions(txPrevLink, txPage - 1)}
                      disabled={!txPrevLink || tabLoading || txPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      {t('pagination.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">{t('pagination.page')} {txPage}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchTransactions(txNextLink, txPage + 1)}
                      disabled={!txNextLink || tabLoading}
                    >
                      {t('pagination.next')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="effects">
              {tabLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
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
                      {effects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No effects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        effects.map((effect) => (
                          <TableRow key={effect.id}>
                            <TableCell>
                              <Link href={`/account/${effect.account}`} className="text-primary hover:underline font-mono text-sm">
                                {effect.account.slice(0, 8)}...{effect.account.slice(-8)}
                              </Link>
                              {" "}
                              <CopyIcon textToCopy={effect.account} />
                            </TableCell>
                            <TableCell className="capitalize">{t(`effects.${effect.type}`) || effect.type.split("_").join(" ")}</TableCell>
                            <TableCell className="font-medium">
                              <span className={
                                effect.type == "account_credited" ? "text-emerald-600" : 
                                effect.type == "account_debited" ? "text-red-600" : 
                                "text-muted-foreground"
                              }>
                                {effect.type == "account_debited" ? "-" : effect.type == "account_credited" ? "+" : ""}
                                {effect.amount ? formatAmount(parseFloat(effect.amount)) : ""}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{timelib.timeAgo(effect.created_at, language)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchEffects(efPrevLink, efPage - 1)}
                      disabled={!efPrevLink || tabLoading || efPage === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      {t('pagination.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">{t('pagination.page')} {efPage}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchEffects(efNextLink, efPage + 1)}
                      disabled={!efNextLink || tabLoading}
                    >
                      {t('pagination.next')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="claimables">
              {tabLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{t('account.latest_100_claimable')}</p>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('account.sponsor')}</TableHead>
                          <TableHead>{t('operations.amount')}</TableHead>
                          <TableHead>{t('account.predicate')}</TableHead>
                          <TableHead>{t('account.create_time')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claimableBalance?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No claimable balances
                            </TableCell>
                          </TableRow>
                        ) : (
                          claimableBalance?.map((claim: any) => (
                            <TableRow key={claim.id}>
                              <TableCell>
                                <AccountLabel account={claim.sponsor} shorten={true} />
                              </TableCell>
                              <TableCell className="font-medium">{formatAmount(parseFloat(claim.amount))}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{describePredicate(claim.claimants.find((c: any) => c.destination == address)?.predicate, language)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{timelib.timeFormat(claim.last_modified_time, language)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  export default AccountDetail;
