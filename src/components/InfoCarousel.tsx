import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useInfoSlides } from '@/hooks/useInfoSlides';

// Fallback slides when DB is empty
const fallbackSlides = [
  {
    id: 'fallback-1',
    title: 'Welcome to Cineverse Premium',
    description: 'Stream unlimited movies, series & K-Drama with Myanmar subtitles.',
    image_url: null,
    bg_color: 'from-red-600 to-red-800',
    accent_color: 'text-yellow-300',
    display_order: 1,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

export function InfoCarousel() {
  const [current, setCurrent] = useState(0);
  const { data: dbSlides } = useInfoSlides();

  const slides = dbSlides && dbSlides.length > 0 ? dbSlides : fallbackSlides;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Reset current if slides change
  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  const slide = slides[current];

  return (
    <section className="px-4 md:px-8 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Slide */}
        <div
          className={`relative min-h-[160px] md:min-h-[200px] flex transition-all duration-500 ${
            slide.image_url ? '' : `bg-gradient-to-br ${slide.bg_color}`
          }`}
        >
          {/* Background image */}
          {slide.image_url && (
            <>
              <img
                src={slide.image_url}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}

          {/* Text content */}
          <div className="relative z-10 flex flex-col justify-center p-6 md:p-8 w-full">
            <h3 className="text-lg md:text-xl font-bold text-white mb-2 drop-shadow-lg">
              {slide.title}
            </h3>
            {slide.description && (
              <p className={`text-sm md:text-base font-medium leading-relaxed drop-shadow ${
                slide.image_url ? 'text-white/90' : slide.accent_color
              }`}>
                {slide.description}
              </p>
            )}
          </div>
        </div>

        {/* Nav buttons */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'bg-white w-5' : 'bg-white/40 w-2'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
