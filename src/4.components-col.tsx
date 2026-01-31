import React from 'react';
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

export const myCompSchema3 = z.object({
    titleText: z.string(),
    titleColor: zColor(),
});

export const imageScreenSchema = z.object({
    titleText: z.string(),
    imageSource: z.string().describe("Image source - can be local path, URL, or base64 data"),
});

// Schema for DynamicCards component
export const dynamicCardsSchema = z.object({
    titleText: z.string().describe("Main title for the component"),
    titleColor: zColor().describe("Color of the main title"),
    cards: z.array(z.object({
        title: z.string().max(4, "Card titles must be 4 words or less").describe("Card title (max 4 words)"),
    })).min(1).max(6).describe("Array of card data (1-6 cards)"),
});

// DynamicCards component implementation
export const DynamicCards: React.FC<z.infer<typeof dynamicCardsSchema>> = ({
    titleText,
    titleColor,
    cards,
}) => {
    const getCardWidth = () => {
        if (cards.length === 1) return '40%';
        if (cards.length === 2) return '35%';
        if (cards.length === 3) return '28%';
        if (cards.length === 4) return '45%';
        if (cards.length === 5 || cards.length === 6) return '30%';
        return '30%';
    };

    return (
        <AbsoluteFill className="bg-slate-900 flex flex-col items-center justify-center gap-8 p-8">
            {/* Main Title */}
            <div className="flex text-center ">
                <h1
                    className="text-7xl font-bold drop-shadow-2xl  text-white"
                // style={{ color: titleColor }}
                >
                    {titleText}
                </h1>
            </div>

            {/* Cards Container */}
            <div className="w-full flex items-center justify-center">
                <div className="flex flex-wrap justify-center gap-8 px-8 w-full">
                    {cards.map((card, index) => {
                        return (
                            <div
                                key={index}
                                className="rounded-2xl px-8 py-20 flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-105"
                                style={{
                                    backgroundColor: '#ffffff',
                                    width: getCardWidth(),
                                    flexShrink: 0,
                                    border: '3px solid rgba(255, 255, 255, 0.2)',
                                }}
                            >
                                <h2 className="text-5xl font-bold text-gray-800 text-center leading-tight">
                                    {card.title}
                                </h2>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};