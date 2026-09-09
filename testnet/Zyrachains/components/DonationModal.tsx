"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { Heart, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: { paymentId?: string; amount: number }) => void;
}

export default function DonationModal({ isOpen, onClose, onSuccess }: DonationModalProps) {
  const { user, createPayment, isPaymentInProgress } = usePiNetwork();
  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const activeAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const resetForm = () => {
    setAmount(10);
    setCustomAmount('');
    setMemo('');
    setStatus('idle');
    setError(null);
  };

  const handleClose = () => {
    if (status !== 'processing') {
      resetForm();
      onClose();
    }
  };

  const handleDonation = async () => {
    if (!activeAmount || activeAmount <= 0) {
      setError('Please enter a valid donation amount');
      return;
    }

    if (!user) {
      setError('Please connect your Pi wallet first');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const paymentData = {
        amount: activeAmount,
        memo: memo || `Donation to Zyrachain - ${activeAmount} π`,
        metadata: {
          type: 'donation',
          userId: user.uid,
          timestamp: new Date().toISOString()
        }
      };

      const result = await createPayment(paymentData);

      if (result.success) {
        setStatus('success');
        setTimeout(() => {
          onSuccess?.({ paymentId: result.paymentId, amount: activeAmount });
          resetForm();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Donation failed');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Donation failed');
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl sm:rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-border/30 relative">
        <button
          onClick={handleClose}
          disabled={status === 'processing'}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-red-500/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Support Zyrachain</h2>
          <p className="text-sm text-muted-foreground mt-1">Your donation helps us keep building</p>
        </div>

        <div className="space-y-4">
          {user && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm text-foreground">
                Donating as <span className="font-medium">@{user.username || user.uid}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Donation Amount (π)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {predefinedAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setAmount(preset); setCustomAmount(''); }}
                  disabled={status === 'processing'}
                  className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                    activeAmount === preset && !customAmount
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {preset} π
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              disabled={status === 'processing'}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
              placeholder="Custom amount"
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Message (Optional)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={status === 'processing'}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm resize-none"
              placeholder="Thank you for supporting Zyrachain!"
              rows={2}
            />
          </div>

          {status === 'processing' && (
            <div className="flex flex-col items-center py-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="mt-2 text-sm text-muted-foreground">Processing donation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-sm text-emerald-600 font-medium">Donation successful!</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleDonation}
              disabled={status === 'processing' || activeAmount <= 0 || isPaymentInProgress}
              className="flex-1"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Donate ${activeAmount} π`
              )}
            </Button>
            <Button
              onClick={handleClose}
              disabled={status === 'processing'}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
