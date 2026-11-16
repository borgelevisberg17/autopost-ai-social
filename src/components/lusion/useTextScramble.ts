import { useState, useCallback, useRef } from "react";

const GLYPHS = "0101_//+*#<>[]{}~%&$ABCDEFXYZ";

export function useTextScramble(initialText: string, speed = 25) {
  const [displayText, setDisplayText] = useState(initialText);
  const intervalRef = useRef<number | null>(null);

  const scramble = useCallback(
    (targetText?: string) => {
      const target = targetText ?? initialText;
      let iteration = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = window.setInterval(() => {
        setDisplayText(() =>
          target
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) return target[index];
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join("")
        );

        if (iteration >= target.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplayText(target);
        }

        iteration += 1 / 2.2;
      }, speed);
    },
    [initialText, speed]
  );

  return { displayText, scramble };
}
