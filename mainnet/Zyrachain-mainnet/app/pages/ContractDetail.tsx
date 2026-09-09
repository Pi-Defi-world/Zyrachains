"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { horizon } from "../../api/horizon";
import { usePageMetadata } from "@/context/pagemetadataContext";
import CopyIcon from "@/components/copyIcon";
import { useLanguage } from "@/context/languagecontext";
import { ArrowLeft, FileCode, Database, ArrowRightLeft, Zap } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";

interface ContractDetailProps {
  contractId: string;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contractId }) => {
  const { language, t } = useLanguage();
  const [contract, setContract] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [effects, setEffects] = useState<any[]>([]);
  const [contractData, setContractData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const { setHeading, setTitle, setDescription } = usePageMetadata();

  useEffect(() => {
    const translatedTitle = `Contract ${contractId?.slice(0, 12)}...`;
    setTitle(translatedTitle);
    setHeading(translatedTitle);
    setDescription(`Smart contract details for ${contractId}`);
    document.title = translatedTitle;
  }, [contractId, setTitle, setDescription, setHeading, language, t]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [contractResult, txResult, effectsResult, dataResult] = await Promise.all([
          horizon.getContractById(contractId),
          horizon.getContractTransactions(contractId, 20),
          horizon.getContractEffects(contractId, 20),
          horizon.getContractData(contractId, 20),
        ]);
        setContract(contractResult);
        setTransactions(txResult?._embedded?.records || []);
        setEffects(effectsResult?._embedded?.records || []);
        setContractData(dataResult?._embedded?.records || []);
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contractId]);

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return 'Unknown';
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const formatAmount = (amount?: string) => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 7 });
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Contract Not Found</h2>
            <p className="text-sm text-muted-foreground mb-4">No contract found with ID: {contractId}</p>
            <Link href="/contracts" className="text-primary hover:underline text-sm">Back to Contracts</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/contracts" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Smart Contract</h1>
          </div>
          <FavoriteButton
            id={contractId}
            type="contract"
            label={`Contract ${contractId.slice(0, 12)}...${contractId.slice(-8)}`}
            detail={contract.admin ? `Admin: ${contract.admin.slice(0, 12)}...` : undefined}
            href={`/contracts/${contractId}`}
            size="sm"
          />
        </div>
      </div>

      {/* Overview Card */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Contract ID</h3>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded break-all">{contractId}</code>
                <CopyIcon textToCopy={contractId} />
              </div>
            </div>
            {contract.admin && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin</h3>
                <div className="flex items-center gap-2">
                  <Link href={`/account/${contract.admin}`} className="text-primary text-sm hover:underline break-all">
                    {contract.admin}
                  </Link>
                  <CopyIcon textToCopy={contract.admin} />
                </div>
              </div>
            )}
            {contract.last_modified_ledger && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Modified Ledger</h3>
                <Link href={`/block/${contract.last_modified_ledger}`} className="text-primary text-sm hover:underline">
                  #{contract.last_modified_ledger}
                </Link>
              </div>
            )}
            {contract.last_modified_time && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Modified</h3>
                <span className="text-sm">{formatDateTime(contract.last_modified_time)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Effects ({effects.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" /> Data ({contractData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-0">
              {effects.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No effects found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effects.map((effect: any) => (
                      <TableRow key={effect.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{effect.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {effect.account ? (
                            <Link href={`/account/${effect.account}`} className="text-primary text-xs hover:underline">
                              {effect.account.slice(0, 8)}...{effect.account.slice(-8)}
                            </Link>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {effect.amount ? `${formatAmount(effect.amount)} PI` : effect.asset_type || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No transactions found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hash</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          <Link href={`/tx/${tx.hash}`} className="text-primary text-xs hover:underline">
                            {tx.hash?.slice(0, 12)}...{tx.hash?.slice(-8)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.successful ? "default" : "destructive"} className="text-xs">
                            {tx.successful ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</TableCell>
                        <TableCell className="text-right text-xs">{formatAmount(tx.fee_charged)} PI</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardContent className="p-0">
              {contractData.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No data entries found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractData.map((entry: any, i: number) => (
                      <TableRow key={entry.id || i}>
                        <TableCell className="text-xs font-mono">{entry.key || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{entry.type || 'unknown'}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono break-all max-w-xs truncate">{entry.value || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractDetail;
