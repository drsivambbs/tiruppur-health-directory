import { useState, useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_facilities';
const MAX_ITEMS = 5;

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const addViewed = useCallback((id: string) => {
    setIds(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIds([]);
  }, []);

  return { ids, addViewed, clearViewed };
}
