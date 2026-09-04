import ContractDetail from '@/app/pages/ContractDetail';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return <ContractDetail contractId={id} />;
}
