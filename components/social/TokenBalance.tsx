'use client';

import React, { useState } from 'react';
import { Coins, Plus, X } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';

export default function TokenBalance() {
  const { tokenBalance } = useSocial();
  const { createPayment, user, isAuthenticated } = usePiNetwork();
  const { t } = useLanguage();
  const [showBuy, setShowBuy] = useState(false);
  const [piAmount, setPiAmount] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  const handleBuy = async () => {
    if (!piAmount || piAmount < 0.01) return;
    if (!user?.uid) { setBuyError('Not authenticated'); return; }
    setBuying(true);
    setBuyError('');
    try {
      const result = await createPayment({
        amount: piAmount,
        memo: `${t('social.buy_receive', { amount: piAmount * 100 })}`,
        metadata: {
          listingType: 'social_tokens',
          listingData: { piAmount, userId: user.uid },
        },
      });
      if (result.success) {
        setShowBuy(false);
        alert(t('social.buy_success'));
      } else {
        setBuyError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setBuyError(err.message || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setShowBuy(!showBuy)}
        className="flex items-center gap-1.5 bg-accent/10 text-accent rounded px-2.5 py-1.5 text-sm font-semibold hover:bg-accent/20 transition-colors"
      >
        <Coins className="w-3.5 h-3.5" />
        {tokenBalance ? tokenBalance.balance.toFixed(2) : '0.00'} ZP
        <Plus className="w-3 h-3 opacity-70" />
      </button>

      {showBuy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm shadow-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{t('social.buy_modal_title')}</h3>
              <button onClick={() => setShowBuy(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-accent/10 rounded-lg p-3 mb-4 text-center">
                <p className="text-lg font-bold text-accent">{t('social.buy_rate')}</p>
              </div>

              <label className="text-xs text-muted-foreground mb-1 block">{t('social.buy_pi_amount')}</label>
              <div className="flex items-center gap-2 mb-3">
                {[0.1, 1, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPiAmount(amt)}
                    className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                      piAmount === amt ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                    }`}
                  >
                    {amt} Pi
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={piAmount}
                onChange={(e) => setPiAmount(parseFloat(e.target.value) || 0)}
                min="0.01" step="0.1"
                className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              <p className="mt-2 text-sm text-center text-foreground">
                {t('social.buy_receive', { amount: piAmount * 100 })}
              </p>

              {tokenBalance && (
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {t('social.buy_current_balance', { balance: tokenBalance.balance.toFixed(2) })}
                </p>
              )}

              {buyError && <div className="mt-2 text-xs text-destructive text-center">{buyError}</div>}

              <button
                onClick={handleBuy}
                disabled={buying || !piAmount || piAmount < 0.01}
                className="w-full mt-3 py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {buying ? t('social.buy_processing') : t('social.buy_pay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
