import { Series, Sequence, continueRender, delayRender } from 'remotion';
import { compositionIdToEntry, RegistryEntry } from './compositionRegistry';
import React from 'react';
import { Audio, staticFile } from 'remotion';
// import reactmarkdown component
import ReactMarkdown from 'react-markdown';
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";

export type Shot = {
    compositionId: string;
    compositionProps: Record<string, unknown>;
    fromFrame: number;
    durationInFrames: number;
};

export type MasterSequenceProps = {
    shots: Shot[];
};

// render shot was added to handle the calculateMetadata function for the CodeTransition composition.
const RenderShot: React.FC<{ entry: RegistryEntry; props: Record<string, unknown> }> = ({ entry, props }) => {
    const Component: any = entry.component as any;
    const [computedProps, setComputedProps] = React.useState<Record<string, unknown> | null>(null);
    const [handle] = React.useState(() => delayRender());

    React.useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                if (entry.calculateMetadata) {
                    const mergedProps = { ...(entry.defaultProps || {}), ...(props || {}) } as any;
                    const meta = await entry.calculateMetadata({ props: mergedProps });
                    if (!cancelled) {
                        setComputedProps(meta?.props ?? mergedProps);
                    }
                } else {
                    setComputedProps({ ...(entry.defaultProps || {}), ...(props || {}) });
                }
            } finally {
                continueRender(handle);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [entry, props, handle]);

    if (!computedProps) return null;
    return <Component {...computedProps} durationInFrames={entry.durationInFrames} />;
};

export const MasterSequenceComp: React.FC<MasterSequenceProps> = ({ shots }) => {

    return (
        <>
            <TransitionSeries>
                {shots.map((shot: Shot, i: number) => {
                    const key = `shot-${i}`;
                    const entry = compositionIdToEntry[shot.compositionId];
                    if (!entry) return null;
                    // randomize show transition
                    const showTransition = Math.random() > 0.5;
                    let transitionDuration = 0;
                    if (showTransition) {
                        transitionDuration = 15;
                    }
                    // this is still not right, cause if I'm showing transition between two shots, both shots need to have transition duration added in them.

                    return (
                        <>
                            {/* TODO: add sound to transition, transitiontime genralize from 15. */}
                            <TransitionSeries.Sequence key={key} durationInFrames={shot.durationInFrames + transitionDuration}  >
                                <RenderShot entry={entry} props={shot.compositionProps || {}} />
                            </TransitionSeries.Sequence>
                            {/* randomize if i want to show transition or not */}
                            {showTransition && (
                                <TransitionSeries.Transition
                                    presentation={
                                        [slide, wipe, fade][Math.floor(Math.random() * 3)]()
                                    }
                                    // timing={linearTiming({ durationInFrames: 15 })}
                                    timing={springTiming({
                                        config: {
                                            damping: 200,
                                        },
                                        durationInFrames: transitionDuration,
                                        durationRestThreshold: 0.001,
                                    })}
                                />
                            )}
                        </>
                    );
                })}

            </TransitionSeries>
            <Audio src={staticFile('p2.mp3')} />
        </>
    );
};

export default MasterSequenceComp;