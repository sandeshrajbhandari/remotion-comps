import { loadFont } from "@remotion/google-fonts/RobotoMono";

export const { fontFamily, waitUntilDone } = loadFont("normal", {
    subsets: ["latin"],
    weights: ["400", "700"],
});

// Base font size for normal content (reduced for better fit)
export const baseFontSize = 36;

// Minimum and maximum font sizes
export const minFontSize = 18;
export const maxFontSize = 50;

// Function to calculate code height based on number of lines and font size
export function calculateCodeHeight(
    lines: string[],
    fontSize: number,
    lineHeight: number = 1.4
): number {
    // Calculate approximate height based on number of lines
    // Add extra space for padding and line spacing
    return lines.length * fontSize * lineHeight + fontSize * 2; // 2 extra font sizes for top/bottom padding
}

// Enhanced function to calculate dynamic font size based on both width and height constraints
export function calculateFontSize(
    codeWidth: number,
    containerWidth: number = 1920,
    maxCharacters: number = 80,
    codeHeight?: number,
    containerHeight?: number,
    lines?: string[]
): number {
    // Calculate the ideal font size based on content width vs container width
    const widthRatio = codeWidth / containerWidth;

    // Reduce font size only when content is very wide (more than 80% of container)
    // Don't increase font size when content is narrow - keep it at base size
    const widthScaleFactor = widthRatio > 0.8 ? Math.max(0.6, 1 / widthRatio) : 1.0;

    // Reduce font size for very long lines (more than 100 characters)
    // Don't increase font size for short lines
    const densityFactor = maxCharacters > 100 ? Math.max(0.8, 120 / maxCharacters) : 1.0;

    let dynamicFontSize = baseFontSize * widthScaleFactor * densityFactor;

    // If we have height information, also consider vertical constraints
    if (lines && lines.length > 0 && containerHeight) {
        // Use an iterative approach to find the optimal font size
        const maxIterations = 3;
        let iteration = 0;

        while (iteration < maxIterations) {
            const currentHeight = calculateCodeHeight(lines, dynamicFontSize);
            const heightRatio = currentHeight / containerHeight;

            if (heightRatio > 0.95) { // If content would exceed 95% of container height
                const heightScaleFactor = 0.95 / heightRatio;
                dynamicFontSize *= heightScaleFactor;
            } else if (heightRatio < 0.7 && dynamicFontSize < baseFontSize * 1.2) {
                // If we have room and font is not too large, try to increase slightly
                dynamicFontSize *= 1.05;
            } else {
                // Height is good, break the loop
                break;
            }

            iteration++;
        }
    }

    // Clamp to min/max bounds
    return Math.max(minFontSize, Math.min(maxFontSize, dynamicFontSize));
}

// Default static font size for backward compatibility
export const fontSize = baseFontSize;
export const tabSize = 3;
export const horizontalPadding = 60;
// Base vertical padding (reduced to prevent clipping)
export const baseVerticalPadding = 30;

// Function to calculate dynamic vertical padding based on font size
export function calculateVerticalPadding(fontSize: number): number {
    // Scale padding proportionally with font size, but with a reasonable minimum
    const scaleFactor = fontSize / baseFontSize;
    return Math.max(15, baseVerticalPadding * scaleFactor * 0.7);
}

// Reduced vertical padding to prevent clipping with larger fonts
export const verticalPadding = baseVerticalPadding;
