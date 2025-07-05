import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface CafeImageProps {
  src: string;
  alt: string;
  isCoffeeMode: boolean;
  className?: string;
  priority?: boolean;
  isPreloaded?: boolean;
}

export default function CafeImage({ src, alt, isCoffeeMode, className = "", priority = false, isPreloaded = false }: CafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!isPreloaded);
  const [isVisible, setIsVisible] = useState(priority || isPreloaded);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPreloaded) {
      setIsLoading(false);
      setIsVisible(true);
    }
  }, [isPreloaded]);

  useEffect(() => {
    if (!imageRef.current || priority || isPreloaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [priority, isPreloaded]);

  if (imageError) {
    return null;
  }

  return (
    <div ref={imageRef} className="relative w-full h-full">
      {isVisible && (
        <Image
          src={src}
          alt={alt}
          width={400}
          height={300}
          className={`w-full h-full object-cover pointer-events-none ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          quality={85}
          unoptimized
        />
      )}
    </div>
  );
}