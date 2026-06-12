"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plug, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { usePiNetwork } from '@/context/PiNetworkContext';

interface MobilePiWelcomeProps {
  onAuthSuccess?: (user: any) => void;
  onClose?: () => void;
}

export function MobilePiWelcome({ onAuthSuccess, onClose }: MobilePiWelcomeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [authStep, setAuthStep] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState(false);
  const [showReason, setShowReason] = useState<string>('');
  const { user, isAuthenticated, authenticate } = usePiNetwork();

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;

      if (isMobile && !isAuthenticated) {
        const hasAuthenticatedBefore = localStorage.getItem('pi_has_authenticated');
        const savedToken = localStorage.getItem('pi_access_token');
        const savedUser = localStorage.getItem('pi_user');
        
        let shouldShow = false;
        let reason = '';
        
        if (!hasAuthenticatedBefore) {
          shouldShow = true;
          reason = 'Welcome! Connect your Pi wallet to get started.';
        } else if (savedToken && savedUser) {
          shouldShow = true;
          reason = 'Your session has expired. Please reconnect your Pi wallet.';
        }
        
        if (shouldShow) {
          setShowReason(reason);
          setTimeout(() => setIsVisible(true), 100);
        }
      } else if (isAuthenticated) {
        setIsVisible(false);
      }
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && authSuccess) {
      console.log('Auto-closing modal after successful authentication');
      localStorage.setItem('pi_has_authenticated', 'true');
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authSuccess]);

  const handlePiAuth = async () => {
    setError(null);
    setLocalLoading(true);
    setAuthStep('Connecting to Pi Network...');
    setAuthSuccess(false);

    try {
      console.log('Starting Pi authentication...');
      
      await authenticate();
      
      console.log('Pi authentication successful!');
      setAuthStep('Authentication successful!');
      setAuthSuccess(true);
      
      onAuthSuccess?.(user);

    } catch (err: any) {
      console.error('Pi authentication error:', err);
      setAuthStep('');
      setAuthSuccess(false);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (err.message) {
        if (err.message.includes('Pi Network authentication failed')) {
          errorMessage = 'Pi Network connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('Failed to load Pi SDK')) {
          errorMessage = 'Unable to load Pi SDK. Please refresh the page and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleClose = () => {
    console.log('Closing MobilePiWelcome modal');
    localStorage.setItem('pi_has_authenticated', 'true');
    setIsVisible(false);
    setAuthSuccess(false);
    setError(null);
    setAuthStep('');
    onClose?.();
  };

  const handleSkip = () => {
    console.log('Skipping Pi authentication');
    localStorage.setItem('pi_has_authenticated', 'true');
    setIsVisible(false);
    setAuthSuccess(false);
    setError(null);
    setAuthStep('');
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" 
      style={{ 
        zIndex: 9999, 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Card className="w-full max-w-sm mx-4 relative animate-in fade-in duration-300 shadow-2xl border-2 border-primary/25 bg-card">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10 transition-colors p-1 rounded-full hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        
        <CardHeader className="text-center pb-4">
          <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plug className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Welcome to Zyrachain</CardTitle>
          <p className="text-muted-foreground text-sm">
            {showReason}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-primary font-medium">Welcome To The Pi Data Center</p>
              <p className="text-sm text-muted-foreground">
                Your Pi wallet is now connected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                onClick={handlePiAuth} 
                disabled={localLoading}
                className="w-full font-semibold"
              >
                {localLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {authStep || 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Plug className="h-4 w-4 mr-2" />
                    Connect Pi Wallet
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                disabled={localLoading}
              >
                Maybe Later
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MobilePiWelcome;
