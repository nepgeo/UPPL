import React, { useState } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

export const Carousel = ({ images }: { images: string[] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    slideChanged: (slider) => setCurrentSlide(slider.track.details.rel),
    slides: { perView: 1 },
    loop: true,
  });

  return (
    <div className="relative">
      <div ref={sliderRef} className="keen-slider rounded-lg overflow-hidden">
        {images.map((src, idx) => (
          <div key={idx} className="keen-slider__slide">
            <img src={src} className="w-full h-96 object-cover" alt={`Slide ${idx}`} />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-4 gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => instanceRef.current?.moveToIdx(idx)}
            className={`w-3 h-3 rounded-full ${
              currentSlide === idx ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
