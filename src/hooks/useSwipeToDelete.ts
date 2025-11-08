import { useRef, useState, useEffect, TouchEvent } from 'react';

interface UseSwipeToDeleteProps {
  onDelete: () => void;
  threshold?: number;
  disabled?: boolean;
}

export const useSwipeToDelete = ({ 
  onDelete, 
  threshold = 100,
  disabled = false 
}: UseSwipeToDeleteProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30
      };
      navigator.vibrate(patterns[style]);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || window.innerWidth > 1024) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;

    // Only allow left swipe
    if (diff > 0) {
      setTranslateX(-diff);
      
      // Trigger haptic when reaching threshold
      if (diff >= threshold && !showDelete) {
        triggerHaptic('medium');
        setShowDelete(true);
      } else if (diff < threshold && showDelete) {
        setShowDelete(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const swipeDistance = Math.abs(translateX);
    const swipeTime = Date.now() - touchStartTime.current;
    const velocity = swipeDistance / swipeTime;

    // Delete if swiped past threshold or fast swipe
    if (swipeDistance >= threshold || (velocity > 0.5 && swipeDistance > 50)) {
      triggerHaptic('heavy');
      setTranslateX(-300); // Swipe off screen
      setTimeout(() => {
        onDelete();
      }, 200);
    } else {
      // Reset position
      setTranslateX(0);
      setShowDelete(false);
    }

    setIsSwiping(false);
  };

  const reset = () => {
    setTranslateX(0);
    setIsSwiping(false);
    setShowDelete(false);
  };

  return {
    elementRef,
    translateX,
    isSwiping,
    showDelete,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
};
