import { useState, useCallback } from 'react';
import { Facility } from '../types';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Status = 'idle' | 'locating' | 'success' | 'error';

interface NearestResult {
  facility: Facility;
  distanceKm: number;
}

export function useNearestFacility() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<NearestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findNearest = useCallback((facilities: Facility[]) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setStatus('error');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const sorted = [...facilities].sort(
          (a, b) =>
            getDistanceKm(coords.latitude, coords.longitude, a.latitude, a.longitude) -
            getDistanceKm(coords.latitude, coords.longitude, b.latitude, b.longitude)
        );
        if (sorted.length > 0) {
          setResult({
            facility: sorted[0],
            distanceKm: getDistanceKm(
              coords.latitude,
              coords.longitude,
              sorted[0].latitude,
              sorted[0].longitude
            ),
          });
        }
        setStatus('success');
      },
      err => {
        setError(err.message);
        setStatus('error');
      },
      { timeout: 8000 }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, findNearest, reset };
}
