import ProjectDetailWrapper from './ProjectDetailWrapper';
import { Business } from '@/lib/types';
import { getBackendUrl } from '@/lib/get-backend-url';

export const dynamic = 'force-dynamic';

async function getProjectById(id: string): Promise<Business | null> {
  try {
    const baseUrl = getBackendUrl();
    const [cexRes, coreTeamRes, generatedRes] = await Promise.all([
      fetch(`${baseUrl}/api/ecosystem?type=cex-addresses`),
      fetch(`${baseUrl}/api/ecosystem?type=core-team-addresses`),
      fetch(`${baseUrl}/api/ecosystem?type=generated-addresses`),
    ]);

    const [cexData, coreTeamData, generatedData] = await Promise.all([
      cexRes.json(),
      coreTeamRes.json(),
      generatedRes.json(),
    ]);

    const processApiData = (data: any[], category: string) => (data || []).map((item: any) => ({
      _id: item._id,
      name: item.Name,
      description: item.Description || '',
      category: category === 'Generated' ? item.Category || 'Generated' : category,
      totalHoldings: 0,
      walletAddress: item.identifier,
      founders: [],
      website: item.Website,
      lastUpdated: item.updatedAt,
      status: 'active',
      marketCap: 0,
      volume24h: 0,
      priceChange24h: 0,
      netPiChange24h: 0,
      logo: item.Logo,
      rank: item.Rank || 0,
    } as Business));

    const allBusinesses = [
      ...processApiData(cexData.data || [], 'CEX'),
      ...processApiData(coreTeamData.data || [], 'Core Team'),
      ...processApiData(generatedData.data || [], 'Generated'),
    ];

    return allBusinesses.find(b => b._id === id) || null;
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return <div>Error: Invalid project ID</div>;
  }

  const project = await getProjectById(id);

  return <ProjectDetailWrapper id={id} initialProject={project} />;
}
