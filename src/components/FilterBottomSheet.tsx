import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { ZONES } from '../lib/db';
import { Ward } from '../types';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  wards: Ward[];
  selectedZone: string;
  selectedType: string;
  selectedWard: string;
  onZoneChange: (id: string) => void;
  onTypeChange: (type: string) => void;
  onWardChange: (id: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  wards,
  selectedZone,
  selectedType,
  selectedWard,
  onZoneChange,
  onTypeChange,
  onWardChange,
  onClear,
  hasActiveFilters,
}: FilterBottomSheetProps) {
  const filteredWards =
    selectedZone === 'all' ? wards : wards.filter(w => w.zoneId === selectedZone);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 pb-safe"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-5 pb-8">
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Filter Facilities</h3>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button onClick={onClear} className="text-sm text-blue-600 font-medium">
                      Clear All
                    </button>
                  )}
                  <button onClick={onClose} className="p-1 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Facility Type
                </label>
                <div className="flex gap-2">
                  {(['all', 'UPHC', 'HWC'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => onTypeChange(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Zone
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { onZoneChange('all'); onWardChange('all'); }}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedZone === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    All Zones
                  </button>
                  {ZONES.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => { onZoneChange(zone.id); onWardChange('all'); }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedZone === zone.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Ward
                </label>
                <select
                  value={selectedWard}
                  onChange={e => onWardChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl p-3"
                >
                  <option value="all">All Wards</option>
                  {filteredWards.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold text-base active:bg-blue-700"
              >
                Show Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
