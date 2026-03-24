import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFacility, getWards, getFacilities, ZONES } from '../lib/db';
import { Facility, Ward, Zone } from '../types';
import { ArrowLeft, MapPin, Phone, Mail, MessageCircle, Share2, Navigation, Building2, User } from 'lucide-react';

export function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [ward, setWard] = useState<Ward | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [parentUphc, setParentUphc] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const fData = await getFacility(id);
        if (fData) {
          setFacility(fData);
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
        await navigator.share({
          title: facility.name,
          text: text,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(text);
      alert('Facility details copied to clipboard!');
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading details...</div>;
  if (!facility) return <div className="flex justify-center py-12">Facility not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1 text-center px-4">Facility Details</h1>
        <button onClick={handleShare} className="p-2 -mr-2 text-blue-600 hover:text-blue-800">
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight pr-4">{facility.name}</h2>
            <span className={`flex-shrink-0 px-3 py-1 text-sm font-bold rounded-full ${
              facility.type === 'UPHC' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {facility.type}
            </span>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{ward?.name || 'Unknown Ward'}</p>
                <p className="text-sm text-gray-500">{zone?.name || 'Unknown Zone'} Zone</p>
                {facility.address && <p className="text-sm text-gray-600 mt-1">{facility.address}</p>}
              </div>
            </div>
            
            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. {facility.medicalOfficerName}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Medical Officer</p>
              </div>
            </div>

            {facility.type === 'HWC' && parentUphc && (
              <div className="flex items-center pt-3 mt-3 border-t border-gray-100">
                <Building2 className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Parent UPHC</p>
                  <Link to={`/facility/${parentUphc.id}`} className="text-sm font-medium text-blue-600 hover:underline">
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
            className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Navigation className="w-6 h-6 mb-2" />
            <span className="font-medium text-sm">Directions</span>
          </a>
          
          <a
            href={`tel:${facility.phone}`}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Phone className="w-6 h-6 mb-2 text-green-600" />
            <span className="font-medium text-sm">Call</span>
          </a>

          <a
            href={`https://wa.me/${facility.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <MessageCircle className="w-6 h-6 mb-2 text-green-500" />
            <span className="font-medium text-sm">WhatsApp</span>
          </a>

          <a
            href={`mailto:${facility.email}`}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Mail className="w-6 h-6 mb-2 text-blue-500" />
            <span className="font-medium text-sm">Email</span>
          </a>
        </div>
      </div>
    </div>
  );
}
