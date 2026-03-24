import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { getFacilities, getWards, ZONES } from '../lib/db';
import { Facility, Ward } from '../types';
import { FacilityCard } from '../components/FacilityCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { FilterBottomSheet } from '../components/FilterBottomSheet';
import { useNearestFacility } from '../hooks/useNearestFacility';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useToast } from '../context/ToastContext';
import { Search, Filter, X, Navigation, Clock } from 'lucide-react';
import Fuse from 'fuse.js';

export function Home() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { ids: recentIds } = useRecentlyViewed();
  const { status: nearestStatus, result: nearestResult, error: nearestError, findNearest, reset: resetNearest } = useNearestFacility();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Handle Near Me result
  useEffect(() => {
    if (nearestStatus === 'success' && nearestResult) {
      navigate('/facility/' + nearestResult.facility.id);
      resetNearest();
    }
    if (nearestStatus === 'error' && nearestError) {
      showToast(nearestError, 'error');
      resetNearest();
    }
  }, [nearestStatus]);

  const filteredWards = selectedZone === 'all'
    ? wards
    : wards.filter(w => w.zoneId === selectedZone);

  const searchData = useMemo(() => {
    return facilities.map(f => {
      const ward = wards.find(w => w.id === f.wardId);
      const zone = ZONES.find(z => z.id === ward?.zoneId);
      return { ...f, wardName: ward?.name || '', zoneName: zone?.name || '' };
    });
  }, [facilities, wards]);

  const fuse = useMemo(() => new Fuse(searchData, {
    keys: ['name', 'medicalOfficerName', 'wardName', 'zoneName'],
    threshold: 0.3,
    includeMatches: true,
  }), [searchData]);

  const filteredFacilities = useMemo(() => {
    let results = searchData;
    if (query.trim()) {
      results = fuse.search(query).map(r => r.item);
    }
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

  // Recently viewed facility objects
  const recentFacilities = useMemo(() => {
    return recentIds
      .map(rid => facilities.find(f => f.id === rid))
      .filter(Boolean) as Facility[];
  }, [recentIds, facilities]);

  const uphcCount = facilities.filter(f => f.type === 'UPHC').length;
  const hwcCount = facilities.filter(f => f.type === 'HWC').length;

  const headerContent = (
    <div className="bg-blue-600 text-white pt-12 pb-6 px-4 rounded-b-3xl shadow-md">
      <h1 className="text-2xl font-bold mb-0.5">Tiruppur Corporation</h1>
      <p className="text-blue-100 text-sm mb-5">Health Facility Directory</p>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-3 border-0 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm shadow-sm"
          placeholder="Search facilities, doctors, wards..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Stat chips */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
        {[
          { label: `All (${facilities.length})`, value: 'all' },
          { label: `UPHC (${uphcCount})`, value: 'UPHC' },
          { label: `HWC (${hwcCount})`, value: 'HWC' },
        ].map(chip => (
          <button
            key={chip.value}
            onClick={() => setSelectedType(chip.value)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedType === chip.value
                ? 'bg-white text-blue-700'
                : 'bg-blue-500/40 text-white'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="pb-24"
      >
        {headerContent}
        <div className="px-4 mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="pb-24"
    >
      {headerContent}

      <div className="px-4 mt-5">
        {/* Controls row */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-gray-900">
            {filteredFacilities.length} {filteredFacilities.length === 1 ? 'Facility' : 'Facilities'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => findNearest(facilities)}
              disabled={nearestStatus === 'locating'}
              className="flex items-center text-sm font-medium px-3 py-1.5 rounded-full border bg-white border-gray-200 text-gray-700 disabled:opacity-60"
            >
              <Navigation className="w-4 h-4 mr-1.5 text-blue-600" />
              {nearestStatus === 'locating' ? 'Locating…' : 'Near Me'}
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center text-sm font-medium px-3 py-1.5 rounded-full border ${
                hasActiveFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filters
            </button>
          </div>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedType}
                <button onClick={() => setSelectedType('all')} className="ml-1.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedZone !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {ZONES.find(z => z.id === selectedZone)?.name} Zone
                <button onClick={() => { setSelectedZone('all'); setSelectedWard('all'); }} className="ml-1.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedWard !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {wards.find(w => w.id === selectedWard)?.name}
                <button onClick={() => setSelectedWard('all')} className="ml-1.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-500 font-medium px-2 py-1">
              Clear all
            </button>
          </div>
        )}

        {/* Recently Viewed */}
        {recentFacilities.length > 0 && !query && !hasActiveFilters && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recently Viewed</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recentFacilities.map(f => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/facility/${f.id}`)}
                  className="flex-shrink-0 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm text-left min-w-[140px]"
                >
                  <span className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded mb-1 ${
                    f.type === 'UPHC' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {f.type}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{f.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Facility List */}
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {filteredFacilities.map(facility => {
            const ward = wards.find(w => w.id === facility.wardId);
            const zone = ZONES.find(z => z.id === ward?.zoneId);
            return (
              <motion.div
                key={facility.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                }}
              >
                <FacilityCard facility={facility} ward={ward} zone={zone} />
              </motion.div>
            );
          })}
          {filteredFacilities.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No facilities found matching your criteria.</p>
              <button
                onClick={() => { clearFilters(); setQuery(''); }}
                className="mt-4 text-blue-600 font-medium"
              >
                Clear All Filters & Search
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <FilterBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        wards={filteredWards}
        selectedZone={selectedZone}
        selectedType={selectedType}
        selectedWard={selectedWard}
        onZoneChange={setSelectedZone}
        onTypeChange={setSelectedType}
        onWardChange={setSelectedWard}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </motion.div>
  );
}
