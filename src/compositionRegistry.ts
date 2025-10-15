import { ComponentType } from "react";
import { z } from "zod";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
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
    CodeSnippet,
} from "./3.still-test";
import { MainComposition } from "./CodeTransitionComposition";
import { calculateMetadata } from "./code-utils/calculate-metadata";

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
                "https://imgs.search.brave.com/y4aahJnEro56covSl-3LEdHiGClPuWSYadZA02mpws8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/LWxoLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS9mS25scFl3ejla/b1ZKMUYwR0VCN0FV/MjI0T09iRDRxQnZX/NlpjY3BBY2NWN25H/U0tfbFNIRFd1eWtV/T0xlNjVoNzJJPXc1/MjYtaDI5Ni1ydw",
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
            alignment: "left",
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
        durationInFrames: 2181, // Total duration from transcript (72.68s * 30fps)
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
            titleText: "Text Screen",
            longMultiLineText: `This is a start of a pragraph or a bullet list.

            - Item 1

            - Item 2

            - Item 3`,
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
                    code: `def calculate_sum(a, b): \n # TODO: Add error handling\n \nreturn a + b\n\nif __name__ == '__main__': \n    print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n     print(calculate_sum(5, 3))  \n `,

                },
                //                 {
                //                     code: `const user = {
                //   name: 'Lorem',
                //   age: 26,
                // };
                // // @errors: 2339
                // console.log(user.location);`,
                //                     title: "Error Example",
                //                 },
                //                 {
                //                     code: `const user = {
                //   name: 'Lorem',
                //   age: 26,
                //   location: 'Ipsum',
                // };

                // console.log(user.location);
                // //           ^?`,
                //                     title: "With Location",
                //                 },
            ],
            language: "python",
            theme: "github-dark",
            transitionDuration: 30,
        },
    },
];

export const compositionIdToEntry = Object.fromEntries(
    compositionRegistry.map((e) => [e.id, e])
) as Record<string, RegistryEntry>;


