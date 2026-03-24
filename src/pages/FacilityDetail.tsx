import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getFacility, getWards, getFacilities, ZONES } from '../lib/db';
import { Facility, Ward, Zone } from '../types';
import { ArrowLeft, MapPin, Phone, Mail, MessageCircle, Share2, Navigation, Building2, User, ChevronRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { SkeletonCard } from '../components/SkeletonCard';

export function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addViewed } = useRecentlyViewed();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [ward, setWard] = useState<Ward | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [parentUphc, setParentUphc] = useState<Facility | null>(null);
  const [childHwcs, setChildHwcs] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const fData = await getFacility(id);
        if (fData) {
          setFacility(fData);
          addViewed(id);

          const wards = await getWards();
          const wData = wards.find(w => w.id === fData.wardId);
          if (wData) {
            setWard(wData);
            setZone(ZONES.find(z => z.id === wData.zoneId) || null);
          }

          if (fData.type === 'HWC' && fData.parentUphcId) {
            const pData = await getFacility(fData.parentUphcId);
            setParentUphc(pData);
          }

          if (fData.type === 'UPHC') {
            const all = await getFacilities();
            setChildHwcs(all.filter(f => f.type === 'HWC' && f.parentUphcId === id));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleShare = async () => {
    if (!facility) return;
    const text = `${facility.name} (${facility.type})\nDr. ${facility.medicalOfficerName}\nPhone: ${facility.phone}\nAddress: ${facility.address || 'N/A'}\nLocation: https://maps.google.com/?q=${facility.latitude},${facility.longitude}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: facility.name, text });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(text);
      showToast('Details copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="min-h-screen bg-gray-50 pb-24"
      >
        <div className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-32 h-5 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="px-4 mt-6 space-y-4">
          <SkeletonCard />
          <div className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />
        </div>
      </motion.div>
    );
  }

  if (!facility) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 mb-4">Facility not found.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 font-medium">Go Back</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1 text-center px-4">
          Facility Details
        </h1>
        <button onClick={handleShare} className="p-2 -mr-2 text-blue-600 hover:text-blue-800">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 leading-tight pr-4">{facility.name}</h2>
            <span
              className={`flex-shrink-0 px-3 py-1 text-sm font-bold rounded-full ${
                facility.type === 'UPHC'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {facility.type}
            </span>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{ward?.name || 'Unknown Ward'}</p>
                <p className="text-sm text-gray-500">{zone?.name || 'Unknown Zone'} Zone</p>
                {facility.address && (
                  <p className="text-sm text-gray-600 mt-1">{facility.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. {facility.medicalOfficerName}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Medical Officer</p>
              </div>
            </div>

            {facility.type === 'HWC' && parentUphc && (
              <div className="flex items-center pt-3 mt-3 border-t border-gray-100">
                <Building2 className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Parent UPHC</p>
                  <Link
                    to={`/facility/${parentUphc.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {parentUphc.name}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://maps.google.com/?daddr=${facility.latitude},${facility.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-2xl shadow-sm active:bg-blue-700 transition-colors"
          >
            <Navigation className="w-6 h-6 mb-2" />
            <span className="font-medium text-sm">Directions</span>
          </a>

          <a
            href={`tel:${facility.phone}`}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm active:bg-gray-100 transition-colors"
          >
            <Phone className="w-6 h-6 mb-2 text-green-600" />
            <span className="font-medium text-sm">Call</span>
            <span className="text-xs text-gray-400 mt-0.5 truncate w-full text-center">{facility.phone}</span>
          </a>

          <a
            href={`https://wa.me/${facility.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm active:bg-gray-100 transition-colors"
          >
            <MessageCircle className="w-6 h-6 mb-2 text-green-500" />
            <span className="font-medium text-sm">WhatsApp</span>
          </a>

          <a
            href={`mailto:${facility.email}`}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm active:bg-gray-100 transition-colors"
          >
            <Mail className="w-6 h-6 mb-2 text-blue-500" />
            <span className="font-medium text-sm">Email</span>
          </a>
        </div>

        {/* Child HWCs for UPHC */}
        {facility.type === 'UPHC' && childHwcs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">
              Health & Wellness Centres ({childHwcs.length})
            </h3>
            <div className="space-y-2">
              {childHwcs.map(hwc => (
                <Link
                  key={hwc.id}
                  to={`/facility/${hwc.id}`}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-xl active:bg-green-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{hwc.name}</p>
                    <p className="text-xs text-gray-500">Dr. {hwc.medicalOfficerName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
