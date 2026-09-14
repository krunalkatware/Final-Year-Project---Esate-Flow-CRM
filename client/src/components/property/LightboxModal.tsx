import React, { useState, useEffect } from 'react';
import { PropertyImage } from '../../types/property';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxModalProps {
  images: PropertyImage[];
  initialIndex?: number;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between animate-fade-in text-white p-4 md:p-6 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="bg-slate-800/80 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wider uppercase">
            Image {currentIndex + 1} of {images.length}
          </span>
          {currentImage.caption && (
            <span className="text-xs text-slate-300 hidden sm:inline font-medium">
              {currentImage.caption}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-slate-800/80 hover:bg-red-600/80 transition-colors text-white"
          title="Close Lightbox (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-2 md:left-6 z-20 p-3 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white backdrop-blur-md transition-all transform hover:scale-110"
          title="Previous Image (Left Arrow)"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Center Image */}
        <div className="max-w-5xl max-h-[75vh] p-2 flex flex-col items-center justify-center">
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Property Image ${currentIndex + 1}`}
            className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-300"
          />
          {currentImage.caption && (
            <p className="mt-3 text-xs md:text-sm text-slate-300 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800">
              {currentImage.caption}
            </p>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-2 md:right-6 z-20 p-3 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white backdrop-blur-md transition-all transform hover:scale-110"
          title="Next Image (Right Arrow)"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex justify-center items-center gap-2 md:gap-3 overflow-x-auto py-2 px-4 max-w-4xl mx-auto custom-scrollbar z-10">
        {images.map((img, index) => (
          <button
            key={img.id || index}
            onClick={() => setCurrentIndex(index)}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
              currentIndex === index
                ? 'border-primary ring-2 ring-primary/40 scale-105 opacity-100'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
};
