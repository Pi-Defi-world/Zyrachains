"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type FavoriteType = 'account' | 'contract' | 'transaction' | 'block' | 'asset';

export interface Favorite {
  id: string;
  type: FavoriteType;
  label: string;
  detail?: string;
  href: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: Favorite[];
  addFavorite: (fav: Omit<Favorite, 'addedAt'>) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (fav: Omit<Favorite, 'addedAt'>) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'zyrachain_favorites';

function loadFavorites(): Favorite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: Favorite[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  } catch { /* quota exceeded */ }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveFavorites(favorites);
  }, [favorites, loaded]);

  const addFavorite = useCallback((fav: Omit<Favorite, 'addedAt'>) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === fav.id)) return prev;
      return [{ ...fav, addedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  const toggleFavorite = useCallback((fav: Omit<Favorite, 'addedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === fav.id);
      if (exists) return prev.filter(f => f.id !== fav.id);
      return [{ ...fav, addedAt: Date.now() }, ...prev];
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
