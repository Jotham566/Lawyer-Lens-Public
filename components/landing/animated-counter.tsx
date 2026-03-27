"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const [ref, isVisible] = useScrollAnimation<HTMLSpanElement>({ once: true });
  const [count, setCount] = useState(0);
  const rafRef = useRef(0);

  const runAnimation = useCallback(() => {
    let startTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [end, duration]);

  useEffect(() => {
    if (!isVisible) return;
    runAnimation();
    return () => cancelAnimationFrame(rafRef.current);
  }, [isVisible, runAnimation]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}
