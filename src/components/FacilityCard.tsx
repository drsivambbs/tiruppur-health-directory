import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Facility, Ward, Zone } from '../types';
import { MapPin, User, Phone, MessageCircle } from 'lucide-react';

interface FacilityCardProps {
  facility: Facility;
  ward?: Ward;
  zone?: Zone;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, ward, zone }) => {
  return (
    <Link to={`/facility/${facility.id}`} className="block">
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:bg-gray-50"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-base font-bold text-gray-900 leading-tight pr-2">{facility.name}</h3>
          <span
            className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${
              facility.type === 'UPHC'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {facility.type}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {ward?.name || 'Unknown Ward'}, {zone?.name || 'Unknown Zone'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">Dr. {facility.medicalOfficerName}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex gap-2">
          <a
            href={`tel:${facility.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
          <a
            href={`https://wa.me/${facility.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>
      </motion.div>
    </Link>
  );
};
