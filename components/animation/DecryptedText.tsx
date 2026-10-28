"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover" | "both";
  revealDirection?: "start" | "end" | "center";
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
}

const ARCHITECTURAL_CHARS = "0123456789XYZΔ°#//::+-";

export function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  characters = ARCHITECTURAL_CHARS,
  className = "",
  parentClassName = "",
  animateOn = "hover",
  revealDirection = "start",
  as: Component = "span",
}: DecryptedTextProps) {
  const prefersReduced = useReducedMotion();
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [hasAnimatedInView, setHasAnimatedInView] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const triggerScramble = useCallback(() => {
    if (prefersReduced) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const length = text.length;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";

            let isResolved = false;
            if (revealDirection === "start") {
              isResolved = index < (iteration / maxIterations) * length;
            } else if (revealDirection === "end") {
              isResolved = index >= length - (iteration / maxIterations) * length;
            } else {
              const center = length / 2;
              const dist = Math.abs(index - center);
              isResolved = dist < (iteration / maxIterations) * (length / 2);
            }

            if (isResolved) {
              return text[index];
            }

            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("");
      });

      iteration += 1;

      if (iteration > maxIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setDisplayText(text);
      }
    }, speed);
  }, [text, speed, maxIterations, characters, revealDirection, prefersReduced]);

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  useEffect(() => {
    if (animateOn === "view" || animateOn === "both") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimatedInView) {
              triggerScramble();
              setHasAnimatedInView(true);
            }
          });
        },
        { threshold: 0.15 }
      );

      const el = elementRef.current;
      if (el) observer.observe(el);

      return () => {
        if (el) observer.unobserve(el);
      };
    }
  }, [animateOn, hasAnimatedInView, triggerScramble]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === "hover" || animateOn === "both") {
      setIsHovering(true);
      triggerScramble();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <Component
      // @ts-expect-error polymorphic ref
      ref={elementRef}
      className={`inline-block font-mono tracking-wider transition-colors duration-200 ${
        isHovering ? "text-clay" : ""
      } ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={className}>{displayText}</span>
    </Component>
  );
}
