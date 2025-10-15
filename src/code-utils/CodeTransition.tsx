import { Easing, interpolate } from "remotion";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { Pre, HighlightedCode, AnnotationHandler } from "codehike/code";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  calculateTransitions,
  getStartingSnapshot,
  TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import { applyStyle } from "./utils";
import { callout } from "./annotations/Callout";

import { tokenTransitions } from "./annotations/InlineToken";
import { errorInline, errorMessage } from "./annotations/Error";
import { fontFamily, fontSize, tabSize, calculateFontSize } from "./font";

export function CodeTransition({
  oldCode,
  newCode,
  durationInFrames = 30,
  codeWidth,
  codeHeight,
  maxCharacters,
  containerWidth = 1920,
  containerHeight = 1080,
}: {
  readonly oldCode: HighlightedCode | null;
  readonly newCode: HighlightedCode;
  readonly durationInFrames?: number;
  readonly codeWidth?: number;
  readonly codeHeight?: number;
  readonly maxCharacters?: number;
  readonly containerWidth?: number;
  readonly containerHeight?: number;
}) {
  const frame = useCurrentFrame();

  const ref = React.useRef<HTMLPreElement>(null);
  const [oldSnapshot, setOldSnapshot] =
    useState<TokenTransitionsSnapshot | null>(null);
  const [handle] = React.useState(() => delayRender());

  const prevCode: HighlightedCode = useMemo(() => {
    return oldCode || { ...newCode, tokens: [], annotations: [] };
  }, [newCode, oldCode]);

  const code = useMemo(() => {
    return oldSnapshot ? newCode : prevCode;
  }, [newCode, prevCode, oldSnapshot]);

  useEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
    }
  }, [oldSnapshot]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
      return;
    }
    const transitions = calculateTransitions(ref.current!, oldSnapshot);
    transitions.forEach(({ element, keyframes, options }) => {
      const delay = durationInFrames * options.delay;
      const duration = durationInFrames * options.duration;
      const linearProgress = interpolate(
        frame,
        [delay, delay + duration],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
      const progress = interpolate(linearProgress, [0, 1], [0, 1], {
        easing: Easing.bezier(0.17, 0.67, 0.76, 0.91),
      });

      applyStyle({
        element,
        keyframes,
        progress,
        linearProgress,
      });
    });
    continueRender(handle);
  });

  const handlers: AnnotationHandler[] = useMemo(() => {
    return [tokenTransitions, callout, errorInline, errorMessage];
  }, []);

  // Extract lines from the current code for height calculation
  const lines = useMemo(() => {
    return code.code.split('\n');
  }, [code.code]);

  const style: React.CSSProperties = useMemo(() => {
    const dynamicFontSize = codeWidth && maxCharacters
      ? calculateFontSize(codeWidth, containerWidth, maxCharacters, codeHeight, containerHeight, lines)
      : fontSize;

    // Scale line height with font size for better readability
    const dynamicLineHeight = Math.max(1.2, Math.min(1.6, 1.2 + (dynamicFontSize - 20) / 80));

    return {
      position: "relative",
      fontSize: dynamicFontSize,
      lineHeight: dynamicLineHeight,
      fontFamily,
      tabSize,
      // Ensure the code container doesn't overflow
      maxWidth: containerWidth ? `${containerWidth}px` : '100%',
      overflow: 'hidden',
    };
  }, [codeWidth, maxCharacters, containerWidth, codeHeight, containerHeight, lines]);

  return <Pre ref={ref} code={code} handlers={handlers} style={{
    ...style,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }} />;
}
