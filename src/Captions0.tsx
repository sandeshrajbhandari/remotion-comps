import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { createTikTokStyleCaptions } from '@remotion/captions';
import type { Caption, TikTokPage as TikTokPageType } from '@remotion/captions';
import { fitText } from '@remotion/layout-utils';
import { makeTransform, scale, translateY } from '@remotion/animation-utils';

export type CaptionStyle = 'highlight' | 'bounce' | 'karaoke' | 'tiktok';

export type Captions0Props = {
    captions: Caption[];
    style: CaptionStyle;
};

const SWITCH_CAPTIONS_EVERY_MS = 1200;
const TIKTOK_WORDS_PER_PAGE = 1;

function chunkCaptionsIntoPages(captions: Caption[], wordsPerPage: number): TikTokPageType[] {
    const pages: TikTokPageType[] = [];
    for (let i = 0; i < captions.length; i += wordsPerPage) {
        const chunk = captions.slice(i, i + wordsPerPage);
        pages.push({
            text: chunk.map((c) => c.text).join(''),
            startMs: chunk[0].startMs,
            tokens: chunk.map((c) => ({
                text: c.text,
                fromMs: c.startMs,
                toMs: c.endMs,
            })),
        });
    }
    return pages;
}

// --- Style 1: Highlight (word turns green when spoken) ---
const HighlightPage: React.FC<{ page: TikTokPageType; enterProgress: number }> = ({ page }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeMs = (frame / fps) * 1000;
    const absoluteTimeMs = page.startMs + currentTimeMs;

    return (
        <AbsoluteFill className="justify-end items-center pb-32">
            <div
                style={{
                    fontSize: 72,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '80%',
                    WebkitTextStroke: '3px black',
                    paintOrder: 'stroke',
                }}
            >
                {page.tokens.map((token) => {
                    const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
                    return (
                        <span
                            key={token.fromMs}
                            style={{ color: isActive ? '#39E508' : 'white' }}
                        >
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

// --- Style 2: Bounce (active word scales up) ---
const BouncePage: React.FC<{ page: TikTokPageType; enterProgress: number }> = ({ page }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeMs = (frame / fps) * 1000;
    const absoluteTimeMs = page.startMs + currentTimeMs;

    return (
        <AbsoluteFill className="justify-end items-center pb-32">
            <div
                style={{
                    fontSize: 72,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '80%',
                    WebkitTextStroke: '3px black',
                    paintOrder: 'stroke',
                }}
            >
                {page.tokens.map((token) => {
                    const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
                    return (
                        <span
                            key={token.fromMs}
                            style={{
                                color: isActive ? '#FFD700' : 'white',
                                display: 'inline-block',
                                transform: isActive ? 'scale(1.3)' : 'scale(1)',
                                transition: 'transform 0.1s',
                            }}
                        >
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

// --- Style 3: Karaoke (progressive fill left-to-right per word) ---
const KaraokePage: React.FC<{ page: TikTokPageType; enterProgress: number }> = ({ page }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTimeMs = (frame / fps) * 1000;
    const absoluteTimeMs = page.startMs + currentTimeMs;

    return (
        <AbsoluteFill className="justify-end items-center pb-32">
            <div
                style={{
                    fontSize: 72,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '80%',
                    WebkitTextStroke: '3px black',
                    paintOrder: 'stroke',
                }}
            >
                {page.tokens.map((token) => {
                    const isPast = token.toMs <= absoluteTimeMs;
                    const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
                    let progress = 0;
                    if (isPast) progress = 100;
                    else if (isActive) {
                        const duration = token.toMs - token.fromMs;
                        progress = duration > 0
                            ? ((absoluteTimeMs - token.fromMs) / duration) * 100
                            : 100;
                    }

                    return (
                        <span
                            key={token.fromMs}
                            style={{
                                color: 'white',
                                backgroundImage: `linear-gradient(90deg, #FF6B35 ${progress}%, white ${progress}%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {token.text}
                        </span>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

// --- Style 4: TikTok (bold uppercase, scale+slide enter, green highlight) ---
const ENTER_ANIMATION_FRAMES = 5;
const DESIRED_FONT_SIZE = 120;
const TIKTOK_HIGHLIGHT_COLOR = '#39E508';

const TikTokStylePage: React.FC<{ page: TikTokPageType; enterProgress: number }> = ({ page }) => {
    const { width } = useVideoConfig();

    const fittedText = fitText({
        fontFamily: 'Poppins',
        text: page.text.trim(),
        withinWidth: width * 0.85,
        textTransform: 'uppercase',
    });

    const fontSize = Math.min(DESIRED_FONT_SIZE, fittedText.fontSize);

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    fontSize,
                    fontFamily: 'Poppins',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: TIKTOK_HIGHLIGHT_COLOR,
                    WebkitTextStroke: '14px black',
                    paintOrder: 'stroke',
                    textAlign: 'center',
                }}
            >
                {page.text.trim()}
            </div>
        </AbsoluteFill>
    );
};

const PAGE_COMPONENTS: Record<CaptionStyle, React.FC<{ page: TikTokPageType; enterProgress: number }>> = {
    highlight: HighlightPage,
    bounce: BouncePage,
    karaoke: KaraokePage,
    tiktok: TikTokStylePage,
};

const EnterAnimationWrapper: React.FC<{ children: (enterProgress: number) => React.ReactNode }> = ({ children }) => {
    const frame = useCurrentFrame();
    const enterProgress = interpolate(frame, [0, ENTER_ANIMATION_FRAMES], [0, 1], {
        extrapolateRight: 'clamp',
    });
    return <>{children(enterProgress)}</>;
};

export const Captions0: React.FC<Captions0Props> = ({ captions, style }) => {
    const { fps } = useVideoConfig();

    const pages = useMemo(() => {
        if (style === 'tiktok') {
            return chunkCaptionsIntoPages(captions, TIKTOK_WORDS_PER_PAGE);
        }
        return createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
        }).pages;
    }, [captions, style]);

    const PageComponent = PAGE_COMPONENTS[style];

    return (
        <AbsoluteFill>
            {pages.map((page, index) => {
                const nextPage = pages[index + 1] ?? null;
                const startFrame = (page.startMs / 1000) * fps;
                const lastToken = page.tokens[page.tokens.length - 1];
                const pageEndMs = lastToken ? lastToken.toMs : page.startMs + SWITCH_CAPTIONS_EVERY_MS;
                const endFrame = nextPage
                    ? (nextPage.startMs / 1000) * fps
                    : (pageEndMs / 1000) * fps;
                const durationInFrames = Math.round(endFrame - startFrame);

                if (durationInFrames <= 0) return null;

                return (
                    <Sequence key={index} from={Math.round(startFrame)} durationInFrames={durationInFrames}>
                        <EnterAnimationWrapper>
                            {(enterProgress) => <PageComponent page={page} enterProgress={enterProgress} />}
                        </EnterAnimationWrapper>
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

export default Captions0;
