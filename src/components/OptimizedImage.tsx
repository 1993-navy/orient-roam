"use client";

import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  placeholder?: "blur" | "shimmer";
}

const PLACEHOLDER_COLORS = [
  "bg-neutral-100",
  "bg-neutral-200",
  "bg-neutral-300",
];

export function OptimizedImage({
  src,
  alt,
  className = "",
  aspectRatio = "16/9",
  placeholder = "shimmer",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const ratioClass = {
    "1/1": "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "9/16": "aspect-[9/16]",
  }[aspectRatio] || "aspect-video";

  const placeholderColor = PLACEHOLDER_COLORS[src.length % PLACEHOLDER_COLORS.length];

  if (error) {
    return (
      <div
        className={`${ratioClass} ${placeholderColor} ${className} flex items-center justify-center`}
      >
        <span className="text-neutral-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${ratioClass} ${className}`}>
      <div
        className={`absolute inset-0 ${placeholderColor} transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        } ${placeholder === "shimmer" ? "animate-shimmer" : ""}`}
      />
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ease-out ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

interface ImageGalleryProps {
  images: { src: string; alt: string }[];
  className?: string;
}

export function ImageGallery({ images, className = "" }: ImageGalleryProps) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return <OptimizedImage src={images[0].src} alt={images[0].alt} className={className} />;
  }
  if (images.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {images.map((img, i) => (
          <OptimizedImage key={i} src={img.src} alt={img.alt} />
        ))}
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <div className="col-span-2 row-span-2">
        <OptimizedImage src={images[0].src} alt={images[0].alt} />
      </div>
      {images.slice(1, 4).map((img, i) => (
        <OptimizedImage key={i} src={img.src} alt={img.alt} />
      ))}
    </div>
  );
}