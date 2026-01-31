import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { getImageSrc } from "./utils/imageUtils";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

import { DotBgAnim } from "./components/backgroundsCustom";

// Utility function to calculate font size based on content length and available space
const calculateFontSize = (content: string, containerWidth: number, containerHeight: number): string => {
    const words = content.split(/\s+/).length;
    const lines = content.split('\n').length;
    const characters = content.length;

    // Base font size calculations
    let baseSize = 60; // Default large size

    // Reduce size for longer content
    if (words > 100) baseSize = 24;
    else if (words > 50) baseSize = 32;
    else if (words > 30) baseSize = 36;
    else if (words > 15) baseSize = 40;

    // Adjust for line count (more lines = smaller font)
    if (lines > 20) baseSize *= 0.6;
    else if (lines > 15) baseSize *= 0.7;
    else if (lines > 10) baseSize *= 0.8;
    else if (lines > 5) baseSize *= 0.9;

    // Adjust for character count (very long words need smaller font)
    if (characters > 1000) baseSize *= 0.7;
    else if (characters > 500) baseSize *= 0.8;

    // Ensure minimum and maximum font sizes
    baseSize = Math.max(16, Math.min(64, baseSize));

    return `${baseSize}px`;
};

// Function to detect programming language from code content
const detectLanguage = (code: string): string => {
    const cleanCode = code.trim();

    // Remove markdown code block markers if present
    const withoutMarkdown = cleanCode.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();

    // JavaScript/TypeScript detection
    if (/(?:const|let|var|function|=>|import|export|console\.log|\.jsx?|\.tsx?)/i.test(withoutMarkdown)) {
        if (/(?:interface|type|enum|as\s|:\s)/i.test(withoutMarkdown)) {
            return 'typescript';
        }
        return 'javascript';
    }

    // Python detection
    if (/(?:def\s|import\s|from\s|print\s*\(|if\s+__name__|lambda|class\s|#\s)/i.test(withoutMarkdown)) {
        return 'python';
    }

    // Java detection
    if (/(?:public\s+class|private\s+|protected\s+|System\.out\.print|import\s+java|package\s+)/i.test(withoutMarkdown)) {
        return 'java';
    }

    // C++ detection
    if (/(?:#include|std::|cout\s*<<|cin\s*>>|namespace\s|using\s+namespace)/i.test(withoutMarkdown)) {
        return 'cpp';
    }

    // C# detection
    if (/(?:using\s+System|Console\.WriteLine|public\s+class|namespace\s|\.cs\b)/i.test(withoutMarkdown)) {
        return 'csharp';
    }

    // Go detection
    if (/(?:package\s+main|func\s+main|import\s+"fmt"|fmt\.Print)/i.test(withoutMarkdown)) {
        return 'go';
    }

    // Rust detection
    if (/(?:fn\s+main|let\s+mut|println!|use\s+|::|->)/i.test(withoutMarkdown)) {
        return 'rust';
    }

    // PHP detection
    if (/(?:<\?php|echo\s|print\s|function\s+\$|->)/i.test(withoutMarkdown)) {
        return 'php';
    }

    // Ruby detection
    if (/(?:def\s|puts\s|require\s|class\s|@\w+|#\s)/i.test(withoutMarkdown)) {
        return 'ruby';
    }

    // HTML detection
    if (/(?:<html|<head|<body|<div|<p|<h[1-6]|<!DOCTYPE)/i.test(withoutMarkdown)) {
        return 'html';
    }

    // CSS detection
    if (/(?:@media|@import|\.\w+\s*\{|#\w+\s*\{|margin:|padding:|color:)/i.test(withoutMarkdown)) {
        return 'css';
    }

    // SQL detection
    if (/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)/i.test(withoutMarkdown)) {
        return 'sql';
    }

    // JSON detection
    if (/(?:\{[\s\S]*\}|\[[\s\S]*\]|"[^"]*"\s*:)/i.test(withoutMarkdown)) {
        return 'json';
    }

    // XML detection
    if (/(?:<\?xml|<[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>)/i.test(withoutMarkdown)) {
        return 'xml';
    }

    // Shell/Bash detection
    if (/(?:#!\/bin\/|#!\/usr\/bin\/|echo\s|ls\s|cd\s|mkdir\s|rm\s|chmod\s)/i.test(withoutMarkdown)) {
        return 'bash';
    }

    // Swift detection
    if (/(?:import\s+Foundation|func\s+|var\s+|let\s+|print\s*\(|class\s+|struct\s+)/i.test(withoutMarkdown)) {
        return 'swift';
    }

    // Kotlin detection
    if (/(?:fun\s+|val\s+|var\s+|println\s*\(|class\s+|import\s+)/i.test(withoutMarkdown)) {
        return 'kotlin';
    }

    // R detection
    if (/(?:<-|print\s*\(|library\s*\(|data\.frame|ggplot|function\s*\()/i.test(withoutMarkdown)) {
        return 'r';
    }

    // Default to text if no language detected
    return 'text';
};

export const myCompSchema3 = z.object({
    titleText: z.string(),
    titleColor: zColor(),
});

export const imageScreenSchema = z.object({
    titleText: z.string(),
    imageSource: z.string().describe("Image source - can be local path, URL, or base64 data"),
});

export const TitleScreen: React.FC<z.infer<typeof myCompSchema3>> = ({
    titleText,
    titleColor,
}) => {
    return (
        <AbsoluteFill className="flex flex-col bg-url bg-amber-50 justify-center items-center gap-8">
            {/* background image */}
            {/* <Img src={"https://walker-web.imgix.net/cms/Gradient_builder_2.jpg?auto=format,compress&w=1920&h=1200&fit=crop&dpr=1.5"} className="absolute inset-0 w-full h-full object-cover -z-30" /> */}
            {/* <Img src={getImageSrc("backdrops/paper-texture-1.jpg")} className="absolute inset-0 w-full h-full object-fill -z-30" /> */}

            <div className="text-center">
                <h1 className="text-[10rem] font-bold font-podkova px-16 py-16 rounded-xl shadow-2xl" style={{ color: titleColor }}>
                    {titleText}
                </h1>
            </div>
            <h2 className="text-4xl px-6 py-3 rounded-lg">

            </h2>
        </AbsoluteFill>
    );
};

export const ImageScreen: React.FC<{
    imageSource: string;
    titleText: string;
}> = ({
    imageSource,
    titleText,
}) => {
        return (
            <AbsoluteFill className="flex flex-col justify-between items-center gap-8">
                {/* background image */}
                <Img src={getImageSrc("backdrops/gradient-bg-1.jpg")} className="absolute inset-0 w-full h-full object-cover -z-30" />
                <div className="flex justify-center items-center h-full py-8">
                    <Img src={getImageSrc(imageSource)} className="rounded-3xl shadow-2xl min-h-[50vh] h-full max-w-[70vw] object-contain" />
                </div>

                {titleText && <h1 className="px-6 py-3 pb-8 rounded-lg">{titleText}</h1>}
            </AbsoluteFill>
        );
    };

export const AvatarScreen: React.FC<{
    imageSource: string;
    alignment: "center" | "left" | "right";
    titleText: string;
}> = ({
    imageSource,
    alignment,
    titleText,
}) => {
        return (
            <AbsoluteFill className="bg-gray-600">
                {alignment === "center" ? (
                    <div className="flex justify-center items-center h-full">
                        <Img src={getImageSrc(imageSource)} className="rounded-2xl max-h-[90vh]  object-cover flex-1/3" />
                    </div>
                ) : (
                    <>
                        {/* <Img src={getImageSrc("backdrops/grid-bg-1.jpg")} className="absolute inset-0 w-full h-full object-cover -z-30" /> */}
                        <div className={`flex ${alignment === "left" ? "flex-row" : "flex-row-reverse"} items-center h-full px-32 gap-12`}>
                            <Img src={getImageSrc(imageSource)} className="rounded-2xl max-h-[90vh]  object-cover flex-1/3" />
                            <h1 className="bg-white px-6 py-20 rounded-lg text-center flex-2/3 w-full" style={{
                                fontSize: titleText.length > 30 ? '2rem' : titleText.length > 20 ? '3rem' : '4rem'
                            }}>{titleText}</h1>
                        </div>
                    </>
                )}
            </AbsoluteFill>
        );
    };

export const TypewriterText: React.FC<{
    text: string;
    speed?: number; // frames per character
    durationInFrames?: number;
}> = ({
    text,
    speed = 3, // A new character every 3 frames by default
    durationInFrames = undefined,
}) => {
        const frame = useCurrentFrame();
        // Utility to calculate speed so text fits in duration
        function getTypewriterSpeed(
            text: string,
            requestedSpeed: number,
            durationInFrames: number | undefined,
            bufferFrames: number = 60
        ) {
            if (!durationInFrames) {
                return requestedSpeed;
            }
            const chars = text.length;
            const maxFramesForTyping = durationInFrames - bufferFrames;
            let speed = requestedSpeed;
            if (chars * requestedSpeed > maxFramesForTyping) {
                speed = Math.floor(maxFramesForTyping / chars) || 1;
            }
            return speed;
        }
        speed = getTypewriterSpeed(text, speed, durationInFrames);
        // Local variables for customization - can be modified later
        const fontSize = 'text-5xl';
        const fontFamily = 'font-sans';
        const textColor = 'text-black';
        const bgColor = 'bg-white';
        const cursorColor = 'bg-black';
        const cursorWidth = 'w-1';
        const cursorHeight = 'h-14';

        // A new character every 'speed' frames
        const charsShown = Math.floor(frame / speed);
        const textToShow = text.slice(0, charsShown);

        // Show the cursor while the text is typing, then start blinking
        const cursorShown =
            textToShow.length === text.length ? Math.floor(frame / 10) % 2 === 1 : true;

        return (
            <AbsoluteFill className={`flex justify-center items-center ${bgColor}`}>
                <div className={`${fontFamily} ${fontSize} ${textColor}`}>
                    {textToShow}
                    <span
                        className={`inline-block ${cursorColor} ${cursorWidth} ${cursorHeight} ml-1 -mt-1 align-middle`}
                        style={{
                            opacity: Number(cursorShown)
                        }}
                    />
                </div>
            </AbsoluteFill>
        );
    };

export const TitleScreenDotBg: React.FC<z.infer<typeof myCompSchema3>> = ({
    titleText,
    titleColor,
}) => {
    return (
        <> <DotBgAnim />
            <AbsoluteFill className="flex flex-col bg-url justify-center items-center gap-8">
                <div className="text-center">
                    <h1 className="text-9xl font-bold  px-16 py-16 rounded-xl shadow-2xl" style={{ color: titleColor }}>
                        {titleText}
                    </h1>
                </div>
                <h2 className="text-4xl px-6 py-3 rounded-lg">

                </h2>
            </AbsoluteFill >
        </>
    );
};

// TextScreen with markdown content and dynamic font sizing
export const TextScreen: React.FC<{
    titleText: string;
    markdownText: string;
}> = ({
    titleText,
    markdownText,
}) => {
        // Calculate dynamic font size for the content
        const contentFontSize = calculateFontSize(markdownText, 800, 600); // Approximate container dimensions

        return (
            <AbsoluteFill className="">
                <>
                    <Img src={getImageSrc("backdrops/grid-bg-1.jpg")} className="absolute inset-0 w-full h-full object-cover -z-30" />
                    <div className={`flex flex-col items-center h-full px-8  bg-yellow-50`}>
                        <h1 className="px-6 pt-40 pb-20 rounded-lg text-center w-full" style={{
                            fontSize: titleText.length > 30 ? '2rem' : titleText.length > 20 ? '4rem' : '5rem'
                        }}>{titleText}</h1>

                        <div className="flex items-center justify-center w-full max-w-[80%] mx-auto">
                            <div className="bg-yellow-50 px-8 rounded-lg w-full max-h-full ">
                                <div
                                    className="prose prose-lg max-w-none"
                                    style={{
                                        fontSize: contentFontSize,
                                        lineHeight: '1.4',
                                    }}
                                >
                                    <ReactMarkdown>
                                        {markdownText}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            </AbsoluteFill>
        );
    };

// code snippet component, macos windows style. accepts markdown code blocks. and title text. shows with proper syntax highlighting.
export const CodeSnippet: React.FC<{
    titleText: string;
    code: string;
    language?: string; // Optional override for manual language specification
}> = ({
    titleText,
    code,
    language,
}) => {
        // Auto-detect language if not provided
        const detectedLanguage = language || detectLanguage(code);

        // Clean the code by removing markdown code block markers
        const cleanCode = code.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();

        return (
            <AbsoluteFill className="">
                <div className="flex flex-col h-full p-8 gap-8">
                    <h1 className="text-center" style={{
                        fontSize: titleText.length > 30 ? '2rem' : titleText.length > 20 ? '3rem' : '4rem'
                    }}>{titleText}</h1>

                    <div className="mx-auto w-2/4 max-w-6xl rounded-xl overflow-hidden shadow-2xl">
                        {/* MacOS window styling */}
                        <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="ml-4 text-gray-300 text-sm font-mono">
                                {detectedLanguage}
                            </div>
                        </div>

                        {/* Code content with syntax highlighting */}
                        <div className="bg-gray-900">
                            <SyntaxHighlighter
                                language={detectedLanguage}
                                style={vscDarkPlus}
                                customStyle={{
                                    margin: 0,
                                    padding: '2rem',
                                    fontSize: '1.5rem',
                                    lineHeight: '1',
                                    background: 'transparent',
                                }}
                                showLineNumbers={false}
                                wrapLines={true}
                                wrapLongLines={true}
                            >
                                {cleanCode}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                </div>
            </AbsoluteFill>
        );
    };