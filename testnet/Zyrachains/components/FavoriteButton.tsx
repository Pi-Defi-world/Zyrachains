"use client";
import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites, type FavoriteType } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/button';

interface FavoriteButtonProps {
  id: string;
  type: FavoriteType;
  label: string;
  detail?: string;
  href: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export default function FavoriteButton({ id, type, label, detail, href, size = 'default', className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(id);

  return (
    <Button
      variant={fav ? 'default' : 'outline'}
      size={size}
      className={`${className} ${fav ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : ''}`}
      onClick={() => toggleFavorite({ id, type, label, detail, href })}
    >
      <Heart className={`h-4 w-4 ${fav ? 'fill-current' : ''}`} />
    </Button>
  );
}
