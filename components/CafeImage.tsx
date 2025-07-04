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

  if (imageError) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        width={400}
        height={300}
        className={`w-full h-full object-cover pointer-events-none ${className}`}
        priority={priority}
        onError={() => setImageError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        quality={85}
        unoptimized
      />
    </div>
  );
}