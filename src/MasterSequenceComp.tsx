import { Series, Sequence, continueRender, delayRender } from 'remotion';
import { compositionIdToEntry, RegistryEntry } from './compositionRegistry';
import React from 'react';
import { Audio, staticFile } from 'remotion';

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
    return <Component {...computedProps} />;
};

export const MasterSequenceComp: React.FC<MasterSequenceProps> = ({ shots }) => {

    return (
        <>
            <>
                {shots.map((shot: Shot, i: number) => {
                    const key = `shot-${i}`;
                    const entry = compositionIdToEntry[shot.compositionId];
                    if (!entry) return null;
                    return (
                        <Sequence key={key} from={shot.fromFrame} durationInFrames={shot.durationInFrames}  >
                            <RenderShot entry={entry} props={shot.compositionProps || {}} />
                        </Sequence>
                    );
                })}

            </>
            <Audio src={staticFile('p2.mp3')} />
        </>
    );
};

export default MasterSequenceComp;