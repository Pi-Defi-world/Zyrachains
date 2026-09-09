"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { horizon } from "../../api/horizon";
import { usePageMetadata } from "@/context/pagemetadataContext";
import CopyIcon from "@/components/copyIcon";
import OperationText from "@/components/operationtext";
import { okx } from "../../api/okx";
import AccountLabel from "@/components/AccountLabel";
import { isPiCoreTeamAccount } from "../../utils/accountUtils";
import { getUnlockTime } from "../../utils/predicate";
import { useLanguage } from "@/context/languagecontext";
import { formatDistanceToNowWithLocale } from "../../utils/time";
// import { CardContent } from "../../components/Card";
// import AdSenseUnit from "../components/AdsenseUnit";
// import AdUnit from "../components/AdUnit";

interface TransactionDetailsProps {
  hash: string;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ hash }) => {
  const [txData, setTxData] = useState<any>(null);
  const [operations, setOperations] = useState<any[]>([]);
  const [effects, setEffects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [piPriceUSD, setPiPriceUSD] = useState(0.0);
  const { setHeading, setTitle, setDescription } = usePageMetadata();
  const { t, language } = useLanguage();

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
    setTitle(String(t('transaction.title', { id: hash })));
    setHeading(String(t('transaction.heading')));
    setDescription(String(t('transaction.description', { id: hash })));
    
    // Update the page metadata immediately for SEO
    document.title = String(t('transaction.title', { id: hash }));
    document.querySelector('meta[name="description"]')?.setAttribute("content", String(t('transaction.description', { id: hash })));
  }, [hash, setTitle, setDescription, setHeading, t, language]);

  // Fetch transaction detail from API
  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);
      if (hash) {
        const response = await horizon.getTransactionByHash(hash);
        setTxData(response);
      } else {
        setTxData(null);
      }
    } catch (error) {
      console.error("Error fetching tx detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperations = async () => {
    try {
      if (!hash) {
        return;
      }
      setTabLoading(true);
      const response = await horizon.getOperationByTxHash(hash);
      setOperations(response._embedded.records);
    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchEffects = async () => {
    try {
      if (!hash) {
        return;
      }
      setTabLoading(true);
      const response = await horizon.getEffectByTxHash(hash);
      setEffects(response._embedded.records);
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
      if (hash) {
        fetchOperations();
        fetchEffects();
      }
    } catch (error) {
      console.error("Error fetching tab data:", error);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetail();
    fetchTabData();
  }, [hash]);

  // Format number according to user locale
  const formatNumber = (value: number): string => {
    return value.toLocaleString(language, {  
      minimumFractionDigits: 0,  
      maximumFractionDigits: 3 
    });
  };
  
  // Format currency according to user locale
  const formatCurrency = (value: number, currencyCode: string = 'USD'): string => {
    return value.toLocaleString(language, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    });
  };

  // Function to generate transaction summary
  const getTransactionSummary = () => {
    if (!operations || operations.length === 0) {
      return t('transaction.loading_details');
    }

    // Case 1: If there's only 1 operation
    if (operations.length === 1) {
      // Return a simplified version of the operation text
      return <OperationText op={operations[0]} PiPrice={piPriceUSD} />;
    }

    // Case 2: Check for claim_claimable_balance operations from Pi Core Team
    const claimOps = operations.filter(op => op.type === "create_claimable_balance");
    const isPiCoreTeam = txData?.source_account && isPiCoreTeamAccount(txData.source_account);
    if (claimOps.length > 0 && isPiCoreTeam) {
      // Count each operation as a separate recipient
      const recipientCount = claimOps.length;

      // Calculate total amount
      let totalAmount = 0;
      claimOps.forEach(op => {
        if (op.amount) {
          totalAmount += parseFloat(op.amount);
        }
      });

      // Extract lock period information
      let lockPeriodText = "";
      let minLockDays = Number.MAX_SAFE_INTEGER;
      let maxLockDays = 0;
      let hasLockPeriod = false;

      // Examine each operation to find the range of lock periods
      claimOps.forEach(op => {
        if (op.claimants && op.claimants.length > 0) {
          // Find the claimant that is not the Pi Core Team address
          const PI_CORE_ADDRESS = "GC5RNDCRO6DDM7NZDEMW3RIN5K6AHN6GMWSZ5SAH2TRJLVGQMB2I3BNJ";
          const userClaimant = op.claimants.find((c: { destination: string; }) => c.destination !== PI_CORE_ADDRESS);
          
          if (userClaimant?.predicate) {
            const predicate = userClaimant.predicate;
            let lockDays = 0;
            
            // Calculate lock days using the "not.abs_before" pattern
            if (predicate.not?.abs_before) {
              const lockEndDate = new Date(predicate.not.abs_before);
              const lockStartDate = new Date(txData.created_at || new Date());
              lockDays = Math.round((lockEndDate.getTime() - lockStartDate.getTime()) / (1000 * 60 * 60 * 24));
            } 
            // Handle relative time locks using "not.rel_before" pattern
            else if (predicate.not?.rel_before) {
              // rel_before is in seconds, convert to days
              lockDays = Math.round(predicate.not.rel_before / 86400);
            }
            // Use the getUnlockTime function as a fallback for more complex predicates
            else {
              const unlockTimeSeconds = getUnlockTime(predicate, txData.created_at);
              lockDays = Math.round(unlockTimeSeconds / (24 * 60 * 60));
            }
            
            if (lockDays > 0) {
              hasLockPeriod = true;
              minLockDays = Math.min(minLockDays, lockDays);
              maxLockDays = Math.max(maxLockDays, lockDays);
            }
          }
        }
      });

      // Format lock period text based on what we found
      if (hasLockPeriod) {
        if (minLockDays === maxLockDays) {
          // If all locks are for the same duration
          lockPeriodText = String(t('transaction.locked_for_days', { days: formatNumber(minLockDays) }));
        } else {
          // Show the range of lock periods
          lockPeriodText = String(t('transaction.locked_range_days', { 
            minDays: formatNumber(minLockDays),
            maxDays: formatNumber(maxLockDays)
          }));
        }
      }

      // Calculate USD value
      const usdValue = totalAmount * piPriceUSD;

      return (
        <span>
          {t('transaction.core_team_distributed')}{" "}
          <b className="text-green-600">
            {formatNumber(totalAmount)} π
          </b>{" "}
          <span className="text-gray-500">
            ({formatCurrency(usdValue)})
          </span> {t('transaction.to')}{" "}
          <b>
            {recipientCount}
          </b>{" "}
          {t(recipientCount === 1 ? 'transaction.account' : 'transaction.accounts')}
          {lockPeriodText}
        </span>
      );
    }

    // Default case: Generic summary with operation count
    return t('transaction.with_operations', { count: operations.length });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner />
        <p>{t('transaction.loading')}</p>
      </div>
    );
  }

  if (!txData) {
    return <p className="text-center text-red-600">{t('transaction.not_found')}</p>;
  }

  return (
    <div>
      <div className="white-zone">
        <h2 className="mb-4">{t('transaction.heading')}</h2>

        {/* Transaction Information */}
        <Table>
          <TableBody>
            <TableRow>
              <TableHead>{t('transaction.hash')}</TableHead>
              <TableCell className="break-all">{txData.hash} {" "}<CopyIcon textToCopy={txData.hash} /></TableCell>
            </TableRow>

            <TableRow>
              <TableHead>{t('transaction.ledger_block')}</TableHead>
              <TableCell className="break-all">
                <Link href={`/block/${txData.ledger}`} className="no-underline">
                  {txData.ledger}
                </Link>
                {" "}
                <CopyIcon textToCopy={txData.ledger} />
                <span className="text-gray-500"> ({formatDistanceToNowWithLocale(new Date(txData.created_at), language)})</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>{t('transaction.result')}</TableHead>
              <TableCell>
                {txData.successful ? (
                  <Badge variant="default" className="bg-green-500 text-white text-xs">
                    <i className="bi bi-check"></i> {t('transaction.successful')}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <i className="bi bi-exclamation"></i> {t('transaction.failed')}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>{t('transaction.source_account')}</TableHead>
              <TableCell className="break-all">
                <AccountLabel account={txData.source_account} shorten={false} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>{t('transaction.fee_account')}</TableHead>
              <TableCell className="break-all">
                <AccountLabel account={txData.fee_account} shorten={false} />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableHead>{t('transaction.fee')}</TableHead>
              <TableCell>
                <b className="text-green-600">{formatNumber(parseInt(txData.fee_charged) / 10_000_000)} π</b>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>{t('transaction.operation_count')}</TableHead>
              <TableCell>
                {txData.operation_count}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>{t('transaction.summary')}</TableHead>
              <TableCell className="break-words">{getTransactionSummary()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 mb-4 block md:hidden">
        {/* <AdSenseUnit/> */}
        {/* <AdUnit
                  className="67cc9f95aa72d3d47fe128c2"
                  width="300px"
                  height="100px"
                  centered={true}
                /> */}
      </div>
      <div className="white-zone">
        <div className="mt-4">
          <h5>{t('transaction.operations')}</h5>
          <div>
            {tabLoading ? (
              <Spinner />
            ) : (
              <>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transaction.source_account')}</TableHead>
                      <TableHead>{t('transaction.operation')}</TableHead>
                      <TableHead>{t('transaction.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          <AccountLabel account={op.source_account} shorten={true} />
                        </TableCell>
                        <TableCell><OperationText op={op} PiPrice={piPriceUSD} /></TableCell>
                        <TableCell className="font-medium">
                          {op.amount ? formatNumber(parseFloat(op.amount)) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="white-zone">
        <div className="mt-4">
          <h5>{t('transaction.effects')}</h5>
          <div>
            {tabLoading ? (
              <Spinner />
            ) : (
              <>
                <Table className="mt-3">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('transaction.account')}</TableHead>
                      <TableHead>{t('transaction.effect')}</TableHead>
                      <TableHead>{t('transaction.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effects.map((effect) => (
                      <TableRow key={effect.id}>
                        <TableCell>
                          <AccountLabel account={effect.account} shorten={true} />
                        </TableCell>
                        <TableCell>{t(`effects.${effect.type}`, effect.type.split("_").join(" "))}</TableCell>
                        <TableCell className="font-medium">
                          <span className={effect.type == "account_credited" ? "text-green-600" : effect.type == "account_debited" ? "text-red-600" : "text-gray-500"}>
                            {effect.type == "account_debited" ? "-" : effect.type == "account_credited" ? "+" : ""}
                            {effect.amount ? formatNumber(parseFloat(effect.amount)) : ""}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
