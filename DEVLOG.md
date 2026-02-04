## 2024-02-04
- Created VideoScreen component for single video playback (similar to ImageScreen pattern)
- Added to composition registry with schema, supports `maxTime` parameter (seconds) and optional `titleText`
- Uses OffthreadVideo, fills entire composition (1920x1080) with object-cover
- Default video: `videos/Big_Buck_Bunny_360_10s_1MB.mp4`
- Branch: `feature/video-sequence-component`

## 2025-10-15
- progress so far.
    - added a compositionRegistry.ts which is used in the Root.tsx to get all available components into the remoteion player.
    - added a MasterSequenceComp.tsx that uses the transcript.json in /public folder to assemble scenes. the transcript.json is derived from the LLM which is fed an audio transcript with available compositions in remotion
- i have another repo for shotlist_prompt_generation that crafts a prompt by pinging this remotion project for available compositions and send the transcript along with the available compositions to the llm. returned json is stored as transcript.json.

- i need to work on refining the designs of the compositions before adding more and continue work.

