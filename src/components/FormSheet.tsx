import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function FormSheet({ isOpen, onClose, title, children }: FormSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: slide-up bottom sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 pb-safe md:hidden max-h-[92vh] flex flex-col"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <button onClick={onClose} className="p-1 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-4 flex-1">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: inline card */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
