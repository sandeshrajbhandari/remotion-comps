import { ComponentType } from "react";
import { z } from "zod";
import MasterSequenceComp, { Shot } from "./MasterSequenceComp";
import {
    TitleScreen as TitleScreenStill,
    myCompSchema3,
    ImageScreen,
    imageScreenSchema,
    AvatarScreen,
    TypewriterText,
    TitleScreenDotBg,
    TextScreen,
} from "./3.still-test";
import { DynamicCards, dynamicCardsSchema } from "./4.components-col";
import { MainComposition } from "./CodeTransitionComposition";
import { calculateMetadata } from "./code-utils/calculate-metadata";
import { VideoScreen } from "./VideosInSequence";

// Import transcript data
import transcriptData from "../public/transcript.json";

// Convert transcript data to shots format
const convertTranscriptToShots = (transcript: any, useNextShotStartTimeForDuration: boolean = true): Shot[] => {
    const fps = 30; // Standard frame rate

    return transcript.shots.map((shot: any, index: number, shots: any[]) => {
        const startTimeSeconds = shot.start_time;
        let durationSeconds: number;

        if (useNextShotStartTimeForDuration && index < shots.length - 1) {
            // Use the next shot's start_time to calculate duration
            const nextStartTime = shots[index + 1].start_time;
            durationSeconds = nextStartTime - startTimeSeconds;

        } else {
            // Use the current shot's end_time to calculate duration
            const endTimeSeconds = shot.end_time;
            durationSeconds = endTimeSeconds - startTimeSeconds;
        }
        // add 2 seconds to the duration for the last shot
        if (index === shots.length - 1) {
            durationSeconds += 2;
            // console.log("last shot, adding 2 seconds to the duration"); 
        }

        return {
            compositionId: shot.compositionId,
            compositionProps: shot.compositionProps || {},
            fromFrame: Math.round(startTimeSeconds * fps),
            durationInFrames: Math.round(durationSeconds * fps),
        };
    });
};

// Schema for TypewriterText component
export const typewriterTextSchema = z.object({
    text: z.string().describe("Text to display with typewriter effect"),
    speed: z.number().optional().describe("Frames per character (default: 3)"),
});

// Schema for CodeTransition component
export const codeTransitionSchema = z.object({
    steps: z.array(z.object({
        code: z.string().describe("Markdown-escaped code snippet"),
        title: z.string().optional().describe("Optional title for the code step"),
    })).describe("Array of code steps with transitions"),
    language: z.string().optional().describe("Programming language for all steps (auto-detected if not provided)"),
    theme: z.enum(["github-dark", "github-light", "dracula", "monokai", "vs-dark"]).optional().describe("Code theme (default: github-dark)"),
    transitionDuration: z.number().optional().describe("Duration of transition in frames (default: 30)"),
    codeWidth: z.number().optional().describe("Width of code area in pixels (default: auto)"),
});

// Schema for VideoScreen component
export const videoScreenSchema = z.object({
    videoSource: z.string().optional().describe("Video source - can be local path or URL (defaults to Big_Buck_Bunny_360_10s_1MB.mp4)"),
    titleText: z.string().optional().describe("Optional title text to display below the video"),
    maxTime: z.number().optional().describe("Maximum time in seconds to play the video (optional)"),
});

export type RegistryEntry = {
    id: string;
    kind: "still" | "composition";
    component: ComponentType<any>;
    width: number;
    height: number;
    fps?: number;
    durationInFrames?: number; // required for kind === "composition"
    schema?: z.ZodTypeAny;
    defaultProps?: Record<string, unknown>;
    calculateMetadata?: any; // Optional for compositions that need metadata calculation
};

// Central registry of all compositions and stills by ID
export const compositionRegistry: RegistryEntry[] = [
    {
        id: "TitleScreenStill",
        kind: "still",
        component: TitleScreenStill,
        width: 1920,
        height: 1080,
        schema: myCompSchema3,
        defaultProps: {
            titleText: "Title Screen",
            titleColor: "#000000",
        },
    },
    {
        id: "ImageScreen",
        kind: "still",
        component: ImageScreen,
        width: 1920,
        height: 1080,
        schema: imageScreenSchema,
        defaultProps: {
            titleText: "Image Screen",
            imageSource:
                "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=2670",
            comments: "available photos are you can pass direct local path like screenshot1.png \
             if local image list is provided OR \n use image urls. \
             \ don't use this composition if relevant image is not provided. In notes, describe the image you're using.",
        },
    },
    {
        id: "AvatarScreen",
        kind: "still",
        component: AvatarScreen,
        width: 1920,
        height: 1080,
        defaultProps: {
            titleText: "Avatar Screen Left Alignment",
            imageSource:
                "avatars/avatar-hand-fold.png",
            alignment: "center",
            comments: "available photos are avatars/avatar-hand-fold.png and avatars/avatar-hand-thumbsup.png \
            \n- Avatar Screen Right Alignment use left, center or right, \
            \n text is not shown when alignment is center",
        },

    },
    // {
    //     id: "HelloWorld",
    //     kind: "composition",
    //     component: HelloWorld,
    //     width: 1920,
    //     height: 1080,
    //     fps: 30,
    //     durationInFrames: 150,
    //     schema: myCompSchema,
    //     defaultProps: {
    //         titleText: "Welcome to Remotion",
    //         titleColor: "#000000",
    //         logoColor1: "#91EAE4",
    //         logoColor2: "#86A8E7",
    //     },
    // },
    // {
    //     id: "OnlyLogo",
    //     kind: "composition",
    //     component: Logo,
    //     width: 1920,
    //     height: 1080,
    //     fps: 30,
    //     durationInFrames: 150,
    //     schema: myCompSchema2,
    //     defaultProps: {
    //         logoColor1: "#91dAE2",
    //         logoColor2: "#86A8E7",
    //     },
    // },
    {
        id: "TypewriterText",
        kind: "composition",
        component: TypewriterText,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 120, // 4 seconds at 30fps
        schema: typewriterTextSchema,
        defaultProps: {
            text: "Typewriter Effect",
            speed: 3,
        },
    },
    {
        id: "MasterSequence",
        kind: "composition",
        component: MasterSequenceComp,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: convertTranscriptToShots(transcriptData).reduce((acc, shot) => acc + shot.durationInFrames, 0), // Total duration from transcript (72.68s * 30fps)
        defaultProps: {
            shots: convertTranscriptToShots(transcriptData),
        },
    },
    {
        id: "TitleScreenDotBg",
        kind: "composition",
        component: TitleScreenDotBg,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 120,
        schema: myCompSchema3,
        defaultProps: {
            titleText: "Title with Animated Dots",
            titleColor: "#000000"
        }
    },
    {
        id: "TextScreen",
        kind: "still",
        component: TextScreen,
        width: 1920,
        height: 1080,
        // schema: myCompSchema3,
        defaultProps: {
            titleText: "",
            markdownText: "This is a start of a markdown pragraph or a bullet list. \n- Item 1 \n-  Item 2 \n- Item 3",
        },
    },
    {
        id: "DynamicCards",
        kind: "still",
        component: DynamicCards,
        width: 1920,
        height: 1080,
        schema: dynamicCardsSchema,
        defaultProps: {
            titleText: "Dynamic Card Layout",
            titleColor: "#ffffff",
            cards: [
                { title: "Card One" },
                { title: "Card Two" },
                { title: "Card Three" },
                { title: "Card Four" },
                { title: "Card Five" },
                { title: "Card Six" },
            ],
            comments: "Dynamic Cards, you can add 1 to 6 cards and the size dynamically. \
            \n this can be used for a list of features or a list of benefits. or to just show a grid of titles or items.",
        },
    },
    //     {
    //         id: "CodeSnippet",
    //         kind: "still",
    //         component: CodeSnippet,
    //         width: 1920,
    //         height: 1080,
    //         // schema: myCompSchema3,
    //         defaultProps: {
    //             titleText: "Code Snippet",
    //             code: `print("Hello, World!")
    // def greet(name):
    //     return f"Hello, {name}!"

    // # This is a Python example
    // result = greet("Developer")
    // print(result)`
    //         },
    //     },
    {
        id: "CodeTransition",
        kind: "composition",
        component: MainComposition,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 270, // 9 seconds for 3 steps with 90 frames each
        schema: codeTransitionSchema,
        calculateMetadata: calculateMetadata,
        defaultProps: {
            title: "",
            steps: [
                {
                    code: `def calculate_sum(a, b):\n    return a + b\n\nif __name__ == '__main__':\n    print(calculate_sum(5, 3))\n`,
                    title: "Initial Function",
                },
                {
                    code: `def calculate_sum(a, b):\n    # Add error handling for non-numeric input\n    if not (isinstance(a, (int, float)) and isinstance(b, (int, float))):\n        raise ValueError("Both arguments must be numbers")\n    return a + b\n\nif __name__ == '__main__':\n    print(calculate_sum(5, 3))\n    # print(calculate_sum("5", 3))  # Uncomment to see error handling`,
                    title: "Add Error Handling",
                },
                {
                    code: `def calculate_sum(a, b):\n    """Return the sum of two numbers after validating input."""\n    # Add error handling for non-numeric input\n    if not (isinstance(a, (int, float)) and isinstance(b, (int, float))):\n        raise ValueError("Both arguments must be numbers")\n    result = a + b\n    print(f"Adding {a} and {b}: {result}")\n    return result\n\nif __name__ == '__main__':\n    print(calculate_sum(5, 3))\n    try:\n        print(calculate_sum("5", 3))\n    except ValueError as e:\n        print(e)`,
                    title: "Add Print and Docstring",
                },
            ],
            language: "python",
            theme: "github-dark",
            transitionDuration: 30,
            comment: "For CodeTransition composition, you can add add multiple steps of a coding concept you want to show and the code will transition between them. \
            \n Always show step by step changes and add a title to each step. "
        },
    },
    {
        id: "CodeStill",
        kind: "composition",
        component: MainComposition,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 120, // 9 seconds for 3 steps with 90 frames each
        schema: codeTransitionSchema,
        calculateMetadata: calculateMetadata,
        defaultProps: {
            title: "",
            steps: [
                {
                    code: `def calculate_sum(a, b): \n # TODO: Add error handling\n \nreturn a + b\n\nif __name__ == '__main__': \n    print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n `,

                },

            ],
            language: "python",
            theme: "github-dark",
            transitionDuration: 30,
        },
    },
    {
        id: "VideoScreen",
        kind: "composition",
        component: VideoScreen,
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300, // 10 seconds default, can be overridden with maxTime
        schema: videoScreenSchema,
        defaultProps: {
            videoSource: "videos/Big_Buck_Bunny_360_10s_1MB.mp4",
            titleText: "",
            maxTime: 10, // 10 seconds default
            comments: "Video playback component. Pass videoSource as local path or URL. Defaults to Big_Buck_Bunny_360_10s_1MB.mp4 if not provided. Use maxTime to limit playback duration in seconds.",
        },
    },

];

export const compositionIdToEntry = Object.fromEntries(
    compositionRegistry.map((e) => [e.id, e])
) as Record<string, RegistryEntry>;


