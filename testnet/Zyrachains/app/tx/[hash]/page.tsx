import TransactionDetails from '@/app/pages/TransactionDetails';

interface PageProps {
  // Update params to be a Promise that resolves to { hash: string }
  params: Promise<{
    hash: string;
  }>;
  // If you also have searchParams here, they would also need to be Promise<...>
  // searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// Make the Page component an async function
export default async function Page({ params }: PageProps) {
  // Await the params object to get the actual data
  const resolvedParams = await params;
  const { hash } = resolvedParams; // Destructure the hash from the resolved object

  // Now you can use 'hash' as a string
  return <TransactionDetails hash={hash} />;
}