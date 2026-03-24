import { useState, useEffect, useMemo } from 'react';
import { getFacilities, getWards, ZONES } from '../lib/db';
import { Facility, Ward } from '../types';
import { FacilityCard } from '../components/FacilityCard';
import { Search, Filter, X } from 'lucide-react';
import Fuse from 'fuse.js';

export function Home() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');

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

  const filteredWards = selectedZone === 'all' 
    ? wards 
    : wards.filter(w => w.zoneId === selectedZone);

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
    threshold: 0.3,
    includeMatches: true
  }), [searchData]);

  const filteredFacilities = useMemo(() => {
    let results = searchData;

    // Apply Search
    if (query.trim()) {
      results = fuse.search(query).map(result => result.item);
    }

    // Apply Filters
    return results.filter(f => {
      if (selectedZone !== 'all' && f.zoneName.toLowerCase() !== ZONES.find(z => z.id === selectedZone)?.name.toLowerCase()) return false;
      if (selectedWard !== 'all' && f.wardId !== selectedWard) return false;
      if (selectedType !== 'all' && f.type !== selectedType) return false;
      return true;
    });
  }, [searchData, query, fuse, selectedZone, selectedWard, selectedType]);

  const clearFilters = () => {
    setSelectedZone('all');
    setSelectedType('all');
    setSelectedWard('all');
  };

  const hasActiveFilters = selectedZone !== 'all' || selectedType !== 'all' || selectedWard !== 'all';

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;

  return (
    <div className="pb-24">
      <div className="bg-blue-600 text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">Tiruppur Corporation</h1>
        <p className="text-blue-100 text-sm mb-6">Health Facility Directory</p>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-3 border-0 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 sm:text-sm shadow-sm"
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

      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {filteredFacilities.length} {filteredFacilities.length === 1 ? 'Facility' : 'Facilities'}
          </h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">Filter By</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-blue-600 font-medium">Clear All</button>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Facility Type</label>
              <div className="flex space-x-2">
                {['all', 'UPHC', 'HWC'].map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedType === type ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Zone</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setSelectedZone('all'); setSelectedWard('all'); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedZone === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Zones
                </button>
                {ZONES.map(zone => (
                  <button
                    key={zone.id}
                    onClick={() => { setSelectedZone(zone.id); setSelectedWard('all'); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedZone === zone.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Ward</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value="all">All Wards</option>
                {filteredWards.map(ward => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedType}
                <button onClick={() => setSelectedType('all')} className="ml-1.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedZone !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {ZONES.find(z => z.id === selectedZone)?.name} Zone
                <button onClick={() => { setSelectedZone('all'); setSelectedWard('all'); }} className="ml-1.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedWard !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {wards.find(w => w.id === selectedWard)?.name}
                <button onClick={() => setSelectedWard('all')} className="ml-1.5"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        <div className="space-y-4">
          {filteredFacilities.map(facility => {
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
          {filteredFacilities.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No facilities found matching your criteria.</p>
              <button onClick={() => { clearFilters(); setQuery(''); }} className="mt-4 text-blue-600 font-medium">Clear All Filters & Search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
