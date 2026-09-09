import BlockDetail from '@/app/pages/BlockDetail'; // Assuming this path is correct for your BlockDetail component

interface PageProps {
  // Update params to be a Promise that resolves to { sequence: string }
  params: Promise<{
    sequence: string;
  }>;
  // If you also have searchParams here, they would also need to be Promise<...>
  // searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// Make the Page component an async function
export default async function Page({ params }: PageProps) {
  // Await the params object to get the actual data
  const resolvedParams = await params;
  const { sequence } = resolvedParams; // Destructure the sequence from the resolved object

  // Now you can use 'sequence' as a string
  return <BlockDetail sequence={sequence} />;
}