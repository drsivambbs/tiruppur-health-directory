import React from 'react';
import { Link } from 'react-router-dom';
import { Facility, Ward, Zone } from '../types';
import { MapPin, User, ChevronRight } from 'lucide-react';

interface FacilityCardProps {
  facility: Facility;
  ward?: Ward;
  zone?: Zone;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, ward, zone }) => {
  return (
    <Link to={`/facility/${facility.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow active:bg-gray-50">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight pr-2">{facility.name}</h3>
          <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${
            facility.type === 'UPHC' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {facility.type}
          </span>
        </div>
        
        <div className="space-y-2">
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
        
        <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}
