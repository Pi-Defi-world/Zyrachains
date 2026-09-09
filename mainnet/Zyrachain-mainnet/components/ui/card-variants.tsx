import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'blue' | 'green' | 'orange' | 'purple';

interface CardVariantProps {
  variant?: CardVariant;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-gradient-to-br from-card via-card to-card/95 border-border/30',
  blue: 'card-accent-blue border-accent-blue',
  green: 'card-accent-green border-accent-green',
  orange: 'card-accent-orange border-accent-orange',
  purple: 'card-accent-purple border-accent-purple',
};

/**
 * Card with color variant support
 */
export const CardVariant = React.forwardRef<
  HTMLDivElement,
  CardVariantProps
>(({ variant = 'default', className, children, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      variantClasses[variant],
      'rounded-lg shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-border/80',
      className
    )}
    {...props}
  >
    {children}
  </Card>
));
CardVariant.displayName = 'CardVariant';

/**
 * Convenience component combining Card + CardContent with variant support
 */
export function CardWithVariant({
  variant = 'default',
  className,
  children,
  ...props
}: CardVariantProps) {
  return (
    <CardVariant variant={variant} className={className} {...props}>
      <CardContent className="p-4 sm:p-5 md:p-6">
        {children}
      </CardContent>
    </CardVariant>
  );
}

/**
 * Helper to get variant class names
 */
export function getCardVariantClasses(variant: CardVariant = 'default'): string {
  return variantClasses[variant];
}
