'use client';

import React, { useEffect, useState } from 'react';
import { Coins, Plus, X } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { usePiNetwork } from '@/context/PiNetworkContext';
import { useLanguage } from '@/context/languagecontext';

export default function TokenBalance() {
  const { tokenBalance, refreshBalance } = useSocial();
  const { createPayment, user, isAuthenticated } = usePiNetwork();
  const { t } = useLanguage();
  const [showBuy, setShowBuy] = useState(false);
  const [piAmount, setPiAmount] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState(false);
  // Live conversion rate from the backend (defaults to 10 ZP/Pi, same as the
  // backend DEFAULT_SETTINGS.zp_per_pi). No hardcoded 100 anywhere.
  const [zpPerPi, setZpPerPi] = useState(10);

  useEffect(() => {
    fetch('/api/pi/payments/config/social_tokens')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rate = data?.config?.zp_per_pi;
        if (typeof rate === 'number' && rate > 0) setZpPerPi(rate);
      })
      .catch(() => {});
  }, []);

  const zpAmount = piAmount * zpPerPi;

  const handleBuy = async () => {
    if (!piAmount || piAmount < 0.01) return;
    if (!user?.uid) { setBuyError('Not authenticated'); return; }
    setBuying(true);
    setBuyError('');
    setBuySuccess(false);
    try {
      const result = await createPayment({
        amount: piAmount,
        memo: `${t('social.buy_receive', { amount: zpAmount })}`,
        metadata: {
          listingType: 'social_tokens',
          listingData: { piAmount, userId: user.uid },
        },
      });
      if (result.success) {
        await refreshBalance();
        setBuySuccess(true);
      } else {
        setBuyError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setBuyError(err.message || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  const closeBuy = () => {
    setShowBuy(false);
    setBuyError('');
    setBuySuccess(false);
    setPiAmount(1);
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
              <button onClick={closeBuy} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {buySuccess ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-7 h-7 text-accent" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {t('social.buy_receive', { amount: zpAmount.toFixed(2) })}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {tokenBalance ? t('social.buy_current_balance', { balance: tokenBalance.balance.toFixed(2) }) : ''}
                </p>
                <button
                  onClick={closeBuy}
                  className="w-full py-2 bg-accent text-accent-foreground rounded-md text-xs font-semibold hover:bg-accent/90 transition-colors"
                >
                  {t('social.ok')}
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="bg-accent/10 rounded-lg p-3 mb-4 text-center">
                  <p className="text-lg font-bold text-accent">{t('social.buy_rate', { rate: zpPerPi })}</p>
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
                  {t('social.buy_receive', { amount: zpAmount.toFixed(2) })}
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
