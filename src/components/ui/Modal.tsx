
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const MotionDiv = motion.div as any;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  noPadding?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, onClose, title, children, footer, size = 'md', className, noPadding = false
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Increased blur for premium feel */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[9998]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[9999] overflow-y-auto pointer-events-none">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className={cn(
                  "w-full bg-white text-left rounded-[24px] shadow-2xl pointer-events-auto flex flex-col relative max-h-[85vh]",
                  sizeClasses[size],
                  className
                )}
              >
                {/* Header - Only render if title exists */}
                {title && (
                  <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-white sticky top-0 z-10 rounded-t-[24px]">
                    <div className="text-xl font-serif font-bold text-stone-900">{title}</div>
                    <button 
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className={cn("flex-1 overflow-y-auto", noPadding ? "p-0" : "p-6")}>
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 rounded-b-[24px] flex justify-end gap-3 shrink-0">
                    {footer}
                  </div>
                )}
              </MotionDiv>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
