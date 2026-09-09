import { Suspense } from 'react';
import TransactionFilter from '@/app/pages/TransactionFilter';
import { Spinner } from '@/components/ui/spinner';

function TransactionFilterWrapper() {
  return <TransactionFilter />;
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
        <span className="sr-only">Loading...</span>
      </div>
    }>
      <TransactionFilterWrapper />
    </Suspense>
  );
} 
