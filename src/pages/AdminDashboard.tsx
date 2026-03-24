import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWards, getFacilities, ZONES } from '../lib/db';
import { MapPin, Building2, Activity, Map } from 'lucide-react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    zones: ZONES.length,
    wards: 0,
    uphcs: 0,
    hwcs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [wards, facilities] = await Promise.all([
          getWards(),
          getFacilities()
        ]);
        
        setStats({
          zones: ZONES.length,
          wards: wards.length,
          uphcs: facilities.filter(f => f.type === 'UPHC').length,
          hwcs: facilities.filter(f => f.type === 'HWC').length
        });
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12">Loading dashboard...</div>;
  }

  const statCards = [
    { name: 'Total Zones', value: stats.zones, icon: Map, color: 'bg-purple-100 text-purple-600' },
    { name: 'Total Wards', value: stats.wards, icon: MapPin, color: 'bg-orange-100 text-orange-600' },
    { name: 'UPHCs', value: stats.uphcs, icon: Building2, color: 'bg-blue-100 text-blue-600' },
    { name: 'HWCs', value: stats.hwcs, icon: Activity, color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/admin/wards" className="block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 transition-colors">
          <h3 className="text-lg font-medium text-gray-900">Manage Wards</h3>
          <p className="mt-2 text-sm text-gray-500">Add, edit, or bulk upload ward data.</p>
        </Link>
        <Link to="/admin/facilities" className="block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 transition-colors">
          <h3 className="text-lg font-medium text-gray-900">Manage Facilities</h3>
          <p className="mt-2 text-sm text-gray-500">Add, edit, or bulk upload UPHCs and HWCs.</p>
        </Link>
      </div>
    </div>
  );
}
