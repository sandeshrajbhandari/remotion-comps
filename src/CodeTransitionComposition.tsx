import { AbsoluteFill, Series, useVideoConfig } from "remotion";
import { ProgressBar } from "./code-utils/ProgressBar";
import { CodeTransition } from "./code-utils/CodeTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./code-utils/theme";
import { useMemo } from "react";
import { tabSize, calculateVerticalPadding, calculateFontSize, calculateCodeHeight } from "./code-utils/font";
// const themeColors = await getThemeColors(theme);
export type Props = {
    steps: HighlightedCode[];
    themeColors: ThemeColors | null;
    codeWidth: number | null;
    language?: string;
    transitionDuration?: number;
    theme?: string;
    width?: { type: string; value?: number };
};

export const MainComposition: React.FC<Props> = ({
    steps,
    themeColors,
    codeWidth,
    language,
    transitionDuration = 30
}) => {
    if (!steps || steps.length === 0) {
        throw new Error("Steps are not defined");
    }

    if (!themeColors) {
        throw new Error("Theme colors are not defined");
    }

    const { durationInFrames } = useVideoConfig();
    const stepDuration = durationInFrames / steps.length;

    // Calculate max characters for dynamic font sizing
    const maxCharacters = useMemo(() => {
        if (!steps || steps.length === 0) return 80;

        return Math.max(
            ...steps
                .map((step) => step.code.split("\n"))
                .flat()
                .map((value) => value.replace(/\t/g, " ".repeat(tabSize)).length)
                .flat(),
        );
    }, [steps]);

    // Get the step with maximum lines for more accurate height calculation
    const maxLinesStep = useMemo(() => {
        if (!steps || steps.length === 0) return null;

        return steps.reduce((maxStep, currentStep) => {
            const currentLines = currentStep.code.split("\n").length;
            const maxLines = maxStep ? maxStep.code.split("\n").length : 0;
            return currentLines > maxLines ? currentStep : maxStep;
        }, null as HighlightedCode | null);
    }, [steps]);

    // Calculate code height based on the step with maximum lines
    const codeHeight = useMemo(() => {
        if (!maxLinesStep || !codeWidth) return undefined;

        const stepLines = maxLinesStep.code.split("\n");
        const dynamicFontSize = calculateFontSize(codeWidth, 1920, maxCharacters, undefined, 1080, stepLines);
        return calculateCodeHeight(stepLines, dynamicFontSize, 1.4);
    }, [maxLinesStep, codeWidth, maxCharacters]);

    const outerStyle: React.CSSProperties = useMemo(() => {
        return {
            backgroundColor: themeColors.background,
        };
    }, [themeColors]);

    const style: React.CSSProperties = useMemo(() => {
        // Calculate dynamic font size for padding calculation
        const dynamicFontSize = codeWidth && maxCharacters
            ? calculateFontSize(codeWidth, 1920, maxCharacters)
            : 40;

        const dynamicVerticalPadding = calculateVerticalPadding(dynamicFontSize);

        return {
            padding: `${dynamicVerticalPadding}px 0px`,
        };
    }, [codeWidth, maxCharacters]);

    return (
        <ThemeProvider themeColors={themeColors}>
            <AbsoluteFill style={outerStyle}>
                <AbsoluteFill
                    style={{
                        width: codeWidth || "100%",
                        margin: "auto",

                    }}
                >
                    {/* <ProgressBar steps={steps} /> */}
                    <AbsoluteFill style={style} className="flex items-center justify-center">
                        <Series>
                            {steps.map((step, index) => (
                                <Series.Sequence
                                    key={index}
                                    layout="none"
                                    durationInFrames={stepDuration}
                                    name={step.meta}
                                >
                                    <CodeTransition
                                        oldCode={steps[index - 1]}
                                        newCode={step}
                                        durationInFrames={transitionDuration}
                                        codeWidth={codeWidth || undefined}
                                        codeHeight={codeHeight || undefined}
                                        maxCharacters={maxCharacters}
                                        containerWidth={1920}
                                        containerHeight={1080}
                                    />
                                </Series.Sequence>
                            ))}
                        </Series>
                    </AbsoluteFill>
                </AbsoluteFill>
            </AbsoluteFill>
        </ThemeProvider>
    );
};
