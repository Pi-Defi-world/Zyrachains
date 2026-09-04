"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useFavorites, type Favorite, type FavoriteType } from '@/context/FavoritesContext';
import { usePageMetadata } from '@/context/pagemetadataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink, Star, Users, FileCode, ArrowRightLeft, Layers, Coins } from 'lucide-react';

const TYPE_CONFIG: Record<FavoriteType, { icon: React.ReactNode; label: string; color: string }> = {
  account: { icon: <Users className="h-4 w-4" />, label: 'Account', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  contract: { icon: <FileCode className="h-4 w-4" />, label: 'Contract', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  transaction: { icon: <ArrowRightLeft className="h-4 w-4" />, label: 'Transaction', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  block: { icon: <Layers className="h-4 w-4" />, label: 'Block', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  asset: { icon: <Coins className="h-4 w-4" />, label: 'Asset', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
};

export default function FavoritesPage() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { setHeading, setTitle } = usePageMetadata();
  const [filter, setFilter] = useState<FavoriteType | 'all'>('all');

  React.useEffect(() => {
    setHeading('Favorites');
    setTitle('Favorites');
  }, [setHeading, setTitle]);

  const filtered = filter === 'all' ? favorites : favorites.filter(f => f.type === filter);
  const types = Object.keys(TYPE_CONFIG) as FavoriteType[];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Favorites
          </h1>
          <p className="text-muted-foreground mt-1">
            {favorites.length} saved item{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
        {favorites.length > 0 && (
          <Button variant="destructive" size="sm" onClick={clearFavorites}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({favorites.length})
        </Button>
        {types.map(t => {
          const count = favorites.filter(f => f.type === t).length;
          if (count === 0) return null;
          return (
            <Button
              key={t}
              variant={filter === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(t)}
            >
              {TYPE_CONFIG[t].label} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {favorites.length === 0
                ? 'No favorites yet. Click the heart icon on any account, contract, or transaction to save it here.'
                : `No ${filter} favorites.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(fav => {
            const config = TYPE_CONFIG[fav.type];
            return (
              <Card key={fav.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className={`${config.color} gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={fav.href} className="font-medium hover:underline truncate block">
                      {fav.label}
                    </Link>
                    {fav.detail && (
                      <p className="text-sm text-muted-foreground truncate">{fav.detail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={fav.href}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => removeFavorite(fav.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
