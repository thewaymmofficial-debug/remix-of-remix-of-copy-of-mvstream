import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InfoSlide {
  titleEn: string;
  titleMm: string;
  descriptionEn: string;
  descriptionMm: string;
  bgColor: string;
  accentColor: string;
}

const slides: InfoSlide[] = [
  {
    titleEn: 'Welcome to Cineverse Premium',
    titleMm: 'Cineverse Premium မှကြိုဆိုပါတယ်',
    descriptionEn: 'Stream unlimited movies, series & K-Drama with Myanmar subtitles. Enjoy HD quality anytime, anywhere!',
    descriptionMm: 'မြန်မာစာတန်းထိုးပါ ရုပ်ရှင်၊ စီးရီး နှင့် K-Drama များကို အကန့်အသတ်မရှိ ကြည့်ရှုလိုက်ပါ။',
    bgColor: 'from-red-600 to-red-800',
    accentColor: 'text-yellow-300',
  },
  {
    titleEn: 'Download & Watch Offline',
    titleMm: 'Download ဆွဲပြီး Offline ကြည့်ပါ',
    descriptionEn: 'Save your favorite movies to watch without internet. Available for Premium members!',
    descriptionMm: 'အင်တာနက်မလိုဘဲ ကြည့်ရှုနိုင်ရန် သင်ကြိုက်နှစ်သက်သော ရုပ်ရှင်များကို သိမ်းဆည်းပါ။',
    bgColor: 'from-blue-600 to-blue-800',
    accentColor: 'text-cyan-300',
  },
  {
    titleEn: 'Request Any Movie',
    titleMm: 'ကြိုက်တဲ့ ရုပ်ရှင် တောင်းဆိုပါ',
    descriptionEn: "Can't find your movie? Request it and we'll add it within 24 hours with Myanmar subtitles!",
    descriptionMm: 'ရှာမတွေ့ဘူးလား? တောင်းဆိုလိုက်ပါ။ ၂၄ နာရီအတွင်း မြန်မာစာတန်းထိုးနှင့် ထည့်ပေးပါမယ်!',
    bgColor: 'from-purple-600 to-purple-800',
    accentColor: 'text-pink-300',
  },
  {
    titleEn: 'Live Football Streaming',
    titleMm: 'ဘောလုံးပွဲ တိုက်ရိုက်ကြည့်ရှုပါ',
    descriptionEn: 'Watch live football matches, replays and highlights. Never miss a game again!',
    descriptionMm: 'ဘောလုံးပွဲများကို တိုက်ရိုက်ကြည့်ရှုပါ။ ပြန်ကြည့်ခြင်းနှင့် Highlight များလည်း ရနိုင်ပါသည်။',
    bgColor: 'from-emerald-600 to-emerald-800',
    accentColor: 'text-lime-300',
  },
  {
    titleEn: 'New Movies Every Day',
    titleMm: 'နေ့တိုင်း ရုပ်ရှင်အသစ်များ',
    descriptionEn: 'We add new movies and series daily. Stay tuned for the latest blockbusters and trending content!',
    descriptionMm: 'နေ့စဉ် ရုပ်ရှင်နှင့် စီးရီးအသစ်များ ထည့်သွင်းပေးပါတယ်။ နောက်ဆုံးပေါ် အကောင်းဆုံးများကို စောင့်ကြည့်ပါ!',
    bgColor: 'from-amber-600 to-amber-800',
    accentColor: 'text-yellow-200',
  },
];

export function InfoCarousel() {
  const [current, setCurrent] = useState(0);
  const { language } = useLanguage();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="px-4 md:px-8 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl max-w-2xl">
        {/* Slide */}
        <div
          className={`bg-gradient-to-br ${slide.bgColor} p-6 md:p-8 min-h-[160px] flex flex-col justify-center transition-all duration-500`}
        >
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">
            {language === 'mm' ? slide.titleMm : slide.titleEn}
          </h3>
          <p className={`text-sm md:text-base ${slide.accentColor} font-medium leading-relaxed`}>
            {language === 'mm' ? slide.descriptionMm : slide.descriptionEn}
          </p>
        </div>

        {/* Nav buttons */}
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

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-white w-5' : 'bg-white/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
