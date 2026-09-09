'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, BookOpen, ShieldCheck, Gift, Coins, Smartphone, Star } from 'lucide-react';

const FAQ_ITEMS = [
  {
    icon: Coins,
    q: 'What is ZP (Zyrachain Points)?',
    a: 'ZP is the on-platform reward currency of Zyrachain. You earn ZP through tips, boosts, streak milestones, missions, and referrals, and you can buy ZP with Pi. ZP powers social features like likes, boosts, and creator support.',
  },
  {
    icon: ShieldCheck,
    q: 'What happens when ZP is tokenized?',
    a: '70% of the total token supply is reserved for the liquidity reserve and liquidity pool (LP) funding of the ZP token when it is tokenized. This ensures deep, stable liquidity at launch and protects the value of the token for holders and ecosystem participants.',
  },
  {
    icon: Gift,
    q: 'How do referrals work?',
    a: 'Share your referral link (your username acts as your unique referral code). When a new user signs up and enters your username, you earn ZP — the reward amount is set by the platform and can be updated by the admin team.',
  },
  {
    icon: Star,
    q: 'How do streaks rewards work?',
    a: 'You do not earn ZP every day for checking in. Instead, ZP is awarded at streak milestones — for example, a 7-day streak earns you a milestone reward. Milestone amounts and intervals are configured by the platform admins.',
  },
  {
    icon: Smartphone,
    q: 'How do content creators earn?',
    a: 'When someone tips or boosts your post, the creator receives a share of the ZP and the platform retains 20% as the platform share. The exact split is configured by the platform and can be updated by the admin team.',
  },
  {
    icon: BookOpen,
    q: 'Where can I learn more?',
    a: 'Explore the ecosystem, communities, and influencers from the social feed, and check the documentation links throughout the site.',
  },
];

function FaqItem({ icon: Icon, q, a }: { icon: React.ElementType; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 sm:p-5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-start gap-3 min-w-0">
          <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm sm:text-base font-semibold text-foreground">{q}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pl-12 sm:pl-16">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background p-3 pb-20 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
            <p className="text-sm text-muted-foreground">Answers to common questions about Zyrachain, ZP, and tokenization.</p>
          </div>
        </div>

        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} icon={item.icon} q={item.q} a={item.a} />
        ))}

        <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
          <p>Still have questions?</p>
          <Link href="/contactUs" className="text-primary hover:underline">
            Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}