"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Twitter, Linkedin, Github } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { ProjectTransactions } from '@/components/ProjectTransactions';
import { Business } from '@/lib/types';
import { horizon } from '@/api/horizon';
import { okx } from '@/api/okx';
import { getUnlockTime, describePredicate } from '@/utils/predicate';
import { timelib } from '@/utils/time';

interface ProjectDetailProps {
  id: string;
  initialProject?: Business | null;
}

async function getProjectById(id: string): Promise<Business | null> {
  try {
    const [cexRes, coreTeamRes, generatedRes] = await Promise.all([
      fetch('/api/addresses/cex'),
      fetch('/api/addresses/core-team'),
      fetch('/api/addresses/generated'),
    ]);

    const [cexData, coreTeamData, generatedData] = await Promise.all([
      cexRes.json(),
      coreTeamRes.json(),
      generatedRes.json(),
    ]);

    const processApiData = (data: any[], category: string) => data.map((item: any) => ({
      _id: item._id,
      name: item.Name,
      description: item.Description || '',
      category: category === 'Generated' ? item.Category || 'Generated' : category,
      totalHoldings: 0, // Will be fetched later if needed
      walletAddress: item.identifier,
      founders: [],
      website: item.Website,
      lastUpdated: item.updatedAt,
      status: 'active',
      marketCap: 0, // Will be fetched later if needed
      volume24h: 0, // Placeholder
      priceChange24h: 0, // Placeholder
      netPiChange24h: 0, // Placeholder
      logo: item.Logo,
      rank: item.Rank || 0,
    } as Business));

    const allBusinesses = [
      ...processApiData(cexData.data || [], 'CEX'),
      ...processApiData(coreTeamData.data || [], 'Core Team'),
      ...processApiData(generatedData.data || [], 'Generated'),
    ];

    const project = allBusinesses.find(b => b._id === id);

    return project || null;

  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ id, initialProject = null }) => {
  const [project, setProject] = useState<Business | null>(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState<string | null>(null);
  const [claimableBalance, setClaimableBalance] = useState<any[]>([]);
  const [totalLocking, setTotalLocking] = useState(0);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [nextUnlockTime, setNextUnlockTime] = useState("");

  useEffect(() => {
    if (!id || initialProject) return;

    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedProject = await getProjectById(id);
        if (fetchedProject) {
          setProject(fetchedProject);

          const priceRes = await okx.getMarketData();
          const piPrice = parseFloat(priceRes.idxPx);

          if (fetchedProject.walletAddress) {
            const [balanceRes, claimableRes] = await Promise.all([
              horizon.getBalances([fetchedProject.walletAddress]),
              horizon.getClaimableBalances(fetchedProject.walletAddress)
            ]);

            // Process balance and market cap
            const balance = balanceRes.length > 0 ? balanceRes[0].Balance : 0;
            const marketCap = balance * piPrice;
            setProject(prev => prev ? { ...prev, totalHoldings: balance, marketCap } : null);

            // Process claimable balances
            setClaimableBalance(claimableRes._embedded.records);
            let locking = 0;
            let claimable = 0;
            let nextUnlock = 0;
            for (const element of claimableRes._embedded.records) {
              const claimant = element.claimants.find((c: any) => c.destination === fetchedProject.walletAddress);
              if (claimant) {
                const unlockTime = getUnlockTime(claimant.predicate, element.last_modified_time);
                if (unlockTime > 0) {
                  locking += parseFloat(element.amount);
                  if (nextUnlock === 0 || nextUnlock > unlockTime) nextUnlock = unlockTime;
                } else {
                  claimable += parseFloat(element.amount);
                }
              }
            }
            setTotalLocking(locking);
            setTotalClaimable(claimable);
            if (nextUnlock > 0) {
              const unlockDate = new Date(Date.now() + Math.round(nextUnlock) * 1000).toUTCString();
              setNextUnlockTime(unlockDate);
            }
          }
        } else {
          setError('Project not found.');
        }
      } catch (err) {
        setError('Failed to load project data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, initialProject]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
        <p className="ml-2">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Link href="/build-on-pi" passHref>
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to projects list
          </Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return <p className="text-center">Project not found.</p>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-8">
        <Link href="/build-on-pi" passHref>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
        </Link>

      <Card className="sm:rounded-lg">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {project.logo && <img src={project.logo} alt={`${project.name} logo`} className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover" />}
            <div className="flex-grow">
              <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                {project.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.category && <Badge>{project.category}</Badge>}
                {project.website && <Badge variant="secondary"><a href={project.website} target="_blank" rel="noopener noreferrer" aria-label="Website">Website</a></Badge>}
                {project.socialLinks?.twitter && <a href={project.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter className="h-5 w-5 text-gray-500 hover:text-gray-800" /></a>}
                {project.socialLinks?.linkedin && <a href={project.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin className="h-5 w-5 text-gray-500 hover:text-gray-800" /></a>}
                {project.socialLinks?.github && <a href={project.socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub"><Github className="h-5 w-5 text-gray-500 hover:text-gray-800" /></a>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <p className="text-sm sm:text-base text-gray-600 mt-2">{project.description}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="p-3 sm:p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Market Cap</p>
                <p className="font-bold text-xl sm:text-2xl">${project.marketCap?.toLocaleString() ?? 'N/A'}</p>
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Total Holdings</p>
                <p className="font-bold text-xl sm:text-2xl">{project.totalHoldings?.toLocaleString() ?? 'N/A'} π</p>
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                  <p className="text-sm text-gray-500">Wallet Address</p>
                <p className="font-mono text-xs sm:text-sm break-all">{project.walletAddress}</p>
              </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="mt-8">
        <TabsContent value="transactions">
          {project.walletAddress && <ProjectTransactions walletAddress={project.walletAddress} />}
        </TabsContent>
        <TabsContent value="claimable">
          <Card>
            <CardHeader>
              <CardTitle>Claimable Balances</CardTitle>
            </CardHeader> 
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Predicate</TableHead>
                    <TableHead>Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claimableBalance.map((balance: any) => (
                    <TableRow key={balance.id}>
                      <TableCell>{parseFloat(balance.amount).toLocaleString()} π</TableCell>
                      <TableCell className="font-mono text-xs">{balance.sponsor}</TableCell>
                      <TableCell>{describePredicate(balance.claimants.find((c: any) => c.destination === project.walletAddress)?.predicate, 'en')}</TableCell>
                      <TableCell>{timelib.timeFormat(balance.last_modified_time, 'en')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
