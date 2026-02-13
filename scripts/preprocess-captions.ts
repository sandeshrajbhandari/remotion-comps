/**
 * Preprocesses transcript.json to populate Captions0 shots with word-level timestamps.
 *
 * Reads transcript.json + wordlevel-timestamp.json from public/,
 * finds shots with compositionId "Captions0", slices the relevant word-level
 * captions based on start_time/end_time, and writes them into compositionProps.captions.
 *
 * Usage:
 *   npx tsx scripts/preprocess-captions.ts
 *   npx tsx scripts/preprocess-captions.ts --transcript public/transcript.json --wordlevel public/wordlevel-timestamp.json
 */

import fs from 'fs';
import path from 'path';

type WordTimestamp = {
    word: string;
    start: number; // seconds
    end: number;   // seconds
};

type Caption = {
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number;
    confidence: number | null;
};

type Shot = {
    sentence: string;
    start_time: number;
    end_time: number;
    compositionId: string;
    compositionProps: Record<string, unknown>;
    [key: string]: unknown;
};

type Transcript = {
    shots: Shot[];
};

function parseArgs() {
    const args = process.argv.slice(2);
    let transcriptPath = path.resolve(__dirname, '../public/transcript.json');
    let wordlevelPath = path.resolve(__dirname, '../public/wordlevel-timestamp.json');

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--transcript' && args[i + 1]) {
            transcriptPath = path.resolve(args[i + 1]);
            i++;
        } else if (args[i] === '--wordlevel' && args[i + 1]) {
            wordlevelPath = path.resolve(args[i + 1]);
            i++;
        }
    }

    return { transcriptPath, wordlevelPath };
}

function sliceCaptions(
    words: WordTimestamp[],
    startTimeSec: number,
    endTimeSec: number,
): Caption[] {
    return words
        .filter((w) => w.end > startTimeSec && w.start < endTimeSec)
        .map((w) => ({
            text: w.word,
            startMs: Math.round(w.start * 1000),
            endMs: Math.round(w.end * 1000),
            timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
            confidence: null,
        }));
}

function main() {
    const { transcriptPath, wordlevelPath } = parseArgs();

    if (!fs.existsSync(transcriptPath)) {
        console.error(`Transcript not found: ${transcriptPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(wordlevelPath)) {
        console.error(`Word-level timestamps not found: ${wordlevelPath}`);
        console.error('Please provide a wordlevel-timestamp.json file in public/');
        process.exit(1);
    }

    const transcript: Transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'));
    const wordTimestamps: WordTimestamp[] = JSON.parse(fs.readFileSync(wordlevelPath, 'utf-8'));

    let captionShotCount = 0;

    for (const shot of transcript.shots) {
        if (shot.compositionId !== 'Captions0') continue;

        const captions = sliceCaptions(wordTimestamps, shot.start_time, shot.end_time);

        if (captions.length === 0) {
            console.warn(
                `⚠ No words found for Captions0 shot at ${shot.start_time}s-${shot.end_time}s: "${shot.sentence}"`,
            );
        }

        shot.compositionProps = {
            ...shot.compositionProps,
            captions,
        };

        captionShotCount++;
        console.log(
            `✓ Populated ${captions.length} words for shot at ${shot.start_time}s-${shot.end_time}s`,
        );
    }

    if (captionShotCount === 0) {
        console.log('No Captions0 shots found in transcript. Nothing to do.');
        return;
    }

    fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));
    console.log(`\nDone! Updated ${captionShotCount} Captions0 shot(s) in ${transcriptPath}`);
}

main();
