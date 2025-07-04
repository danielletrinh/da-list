import Image from 'next/image';
import { useState } from 'react';

interface CafeImageProps {
  src: string;
  alt: string;
  isCoffeeMode: boolean;
  className?: string;
  priority?: boolean;
}

export default function CafeImage({ src, alt, isCoffeeMode, className = "", priority = false }: CafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          isCoffeeMode ? 'bg-coffee-headerBg' : 'bg-bubbleTea-headerBg'
        }`}>
          <div className="animate-pulse text-2xl">☕</div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={400}
        height={300}
        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => setImageError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  );
}