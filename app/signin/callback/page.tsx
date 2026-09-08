'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseCallbackFragment, fetchPiUser } from '@/lib/pi-signin';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function SignInCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing sign-in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const storedState = sessionStorage.getItem('pi_oauth_state');
        const { accessToken, state, error } = parseCallbackFragment(window.location.hash);

        if (error) {
          setStatus('error');
          setMessage(error === 'access_denied' ? 'Sign-in was cancelled' : `Sign-in failed: ${error}`);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (!accessToken) {
          setStatus('error');
          setMessage('No access token received');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (storedState && state && state !== storedState) {
          setStatus('error');
          setMessage('Invalid state — possible CSRF attack');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        sessionStorage.removeItem('pi_oauth_state');

        const user = await fetchPiUser(accessToken);

        localStorage.setItem('pi_access_token', accessToken);
        localStorage.setItem('pi_user', JSON.stringify(user));

        setStatus('success');
        setMessage(`Welcome, ${user.username}!`);

        setTimeout(() => router.push('/social'), 1500);
      } catch (err) {
        console.error('Sign-in callback error:', err);
        setStatus('error');
        setMessage('Failed to complete sign-in');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
            <p className="text-foreground text-lg">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-foreground text-lg">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-foreground text-lg">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
