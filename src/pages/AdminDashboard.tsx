import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getWards, getFacilities, ZONES } from '../lib/db';
import { MapPin, Building2, Activity, Map, ChevronRight } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({ zones: ZONES.length, wards: 0, uphcs: 0, hwcs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [wards, facilities] = await Promise.all([getWards(), getFacilities()]);
        setStats({
          zones: ZONES.length,
          wards: wards.length,
          uphcs: facilities.filter(f => f.type === 'UPHC').length,
          hwcs: facilities.filter(f => f.type === 'HWC').length,
        });
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { name: 'Zones', value: stats.zones, icon: Map, color: 'bg-purple-100 text-purple-600' },
    { name: 'Wards', value: stats.wards, icon: MapPin, color: 'bg-orange-100 text-orange-600' },
    { name: 'UPHCs', value: stats.uphcs, icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { name: 'HWCs', value: stats.hwcs, icon: Activity, color: 'bg-green-100 text-green-600' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-6 bg-gray-200 rounded-full w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded-full w-1/2 mb-3" />
              <div className="h-4 bg-gray-200 rounded-full w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(stat => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
          >
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Management Links */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Manage</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/admin/wards"
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Manage Wards</p>
              <p className="text-sm text-gray-500 mt-0.5">{stats.wards} wards across {stats.zones} zones</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </Link>

          <Link
            to="/admin/facilities"
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">Manage Facilities</p>
              <p className="text-sm text-gray-500 mt-0.5">{stats.uphcs} UPHCs · {stats.hwcs} HWCs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
