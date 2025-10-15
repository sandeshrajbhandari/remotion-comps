import { z } from "zod";
import { CalculateMetadataFunction } from "remotion";
import { getThemeColors } from "@code-hike/lighter";
import { codeTransitionSchema } from "../compositionRegistry";
import { processSnippet, CodeStep } from "./process-snippet";
import { measureText } from "@remotion/layout-utils";
import {
  fontFamily,
  fontSize,
  horizontalPadding,
  tabSize,
  waitUntilDone,
} from "./font";
import { HighlightedCode } from "codehike/code";
import { Theme } from "./theme";

export const calculateMetadata: CalculateMetadataFunction<
  z.infer<typeof codeTransitionSchema>
> = async ({ props }) => {
  const { steps, language, theme = "github-dark", transitionDuration = 30 } = props;

  await waitUntilDone();
  const widthPerCharacter = measureText({
    text: "A",
    fontFamily,
    fontSize,
    validateFontIsLoaded: true,
  }).width;

  const maxCharacters = Math.max(
    ...steps
      .map((step) => step.code.split("\n"))
      .flat()
      .map((value) => value.replaceAll("\t", " ".repeat(tabSize)).length)
      .flat(),
  );


  let codeWidth = 0;
  if (maxCharacters < 50) {
    codeWidth = widthPerCharacter * maxCharacters * 1.5
  } else {
    codeWidth = widthPerCharacter * maxCharacters;
  }


  const defaultStepDuration = 90;

  const themeColors = await getThemeColors(theme);

  const highlightedSteps: HighlightedCode[] = [];
  for (const step of steps) {
    highlightedSteps.push(await processSnippet(step, theme, language));
  }

  const naturalWidth = codeWidth + horizontalPadding * 2;
  const divisibleByTwo = Math.ceil(naturalWidth / 2) * 2; // MP4 requires an even width

  const minimumWidth = 1080;
  const minimumWidthApplied = Math.max(minimumWidth, divisibleByTwo);

  return {
    durationInFrames: steps.length * defaultStepDuration,
    width: minimumWidthApplied,
    props: {
      ...props,

      steps: highlightedSteps,
      themeColors,
      codeWidth,
      language,
      transitionDuration,
    },
  };
};
