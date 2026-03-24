import { useState, useEffect, useMemo } from 'react';
import { getFacilities, getWards, ZONES } from '../lib/db';
import { Facility, Ward } from '../types';
import { FacilityCard } from '../components/FacilityCard';
import { Search, ArrowLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

export function SearchPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [fData, wData] = await Promise.all([getFacilities(), getWards()]);
        setFacilities(fData);
        setWards(wData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Prepare data for Fuse.js
  const searchData = useMemo(() => {
    return facilities.map(f => {
      const ward = wards.find(w => w.id === f.wardId);
      const zone = ZONES.find(z => z.id === ward?.zoneId);
      return {
        ...f,
        wardName: ward?.name || '',
        zoneName: zone?.name || ''
      };
    });
  }, [facilities, wards]);

  const fuse = useMemo(() => new Fuse(searchData, {
    keys: ['name', 'medicalOfficerName', 'wardName', 'zoneName'],
    threshold: 0.3, // Fuzzy matching threshold
    includeMatches: true
  }), [searchData]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).map(result => result.item);
  }, [query, fuse]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              autoFocus
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Search facilities, doctors, wards..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {query.trim() === '' ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Type to search for health facilities, medical officers, or locations.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-gray-500">Searching...</div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">
              {results.length} Results
            </h3>
            {results.map(facility => {
              const ward = wards.find(w => w.id === facility.wardId);
              const zone = ZONES.find(z => z.id === ward?.zoneId);
              return (
                <FacilityCard 
                  key={facility.id} 
                  facility={facility} 
                  ward={ward} 
                  zone={zone} 
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-900 font-medium mb-1">No results found for "{query}"</p>
            <p className="text-gray-500 text-sm">Try checking for spelling errors or use different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
