"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselProps {
  images: string[];
  titles?: string[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function Carousel({
  images,
  titles,
  className,
  autoPlay = true,
  autoPlayInterval = 3000,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [isHovered, setIsHovered] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  }, [images.length]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Auto play functionality
  React.useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(nextSlide, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, nextSlide, autoPlayInterval, images.length]);

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!images.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-64 text-muted-foreground",
          className
        )}
      >
        No images to display
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("relative w-full h-full flex flex-col", className)}>
        <div className="flex-1 flex items-center justify-center">
          <img
            src={images[0]}
            alt="Screenshot"
            className="max-w-full max-h-full object-contain border rounded-lg"
          />
        </div>
        {titles && titles[0] && (
          <div className="mt-4 text-center">
            <h3 className="text-sm font-medium text-foreground max-h-10 overflow-hidden">
              {titles[0]}
            </h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full group flex flex-col", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image container */}
      <div className="relative overflow-hidden rounded-lg flex-1">
        <div
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={`carousel-image-${index}`}
              className="min-w-full h-full flex items-center justify-center"
            >
              <img
                src={image}
                alt={`Screenshot ${index + 1}`}
                className="max-w-full max-h-full object-contain border"
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
          onClick={nextSlide}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Play/Pause toggle (bottom right corner) */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute bottom-2 right-2 transition-opacity bg-background/80 backdrop-blur-sm",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Title display */}
      {titles && titles[currentIndex] && (
        <div className="mt-4 text-center">
          <h3 className="text-sm font-medium text-foreground max-h-10 overflow-hidden">
            {titles[currentIndex]}
          </h3>
        </div>
      )}

      {/* Dots indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {images.map((_, index) => (
          <button
            key={`carousel-dot-${index}`}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex
                ? "bg-foreground"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Image counter */}
      <div className="text-center mt-2 text-sm text-muted-foreground">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
