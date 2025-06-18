'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

/**
 * LazyLoad component that only renders children when they come into view
 * Helps reduce initial bundle size and improve performance
 */
export default function LazyLoad({
  children,
  fallback = <div className="w-full h-32 bg-gray-200 animate-pulse rounded" />,
  rootMargin = '50px',
  threshold = 0.1,
  once = true,
}: LazyLoadProps) {
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        if (inView && once) {
          setHasBeenInView(true);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, once]);

  const shouldRender = once ? (isInView || hasBeenInView) : isInView;

  return (
    <div ref={elementRef}>
      {shouldRender ? children : fallback}
    </div>
  );
}
