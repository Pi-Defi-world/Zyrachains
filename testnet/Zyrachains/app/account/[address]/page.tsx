// app/account/[address]/page.tsx
import AccountDetail from '@/app/pages/accountDetail';

interface PageProps {
  params: Promise<{ address: string }>; // This should match your folder name [address]
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProjectWalletPage({ params }: PageProps) {
  const { address } = await params; // Get address from params
  
  // Add validation
  if (!address || address.trim() === '') {
    return <div>Error: Invalid address</div>;
  }
  
  return <AccountDetail address={address} />;
}