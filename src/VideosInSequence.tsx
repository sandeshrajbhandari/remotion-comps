import {AbsoluteFill, useVideoConfig, staticFile, OffthreadVideo} from 'remotion';

export type VideoScreenProps = {
    videoSource?: string;
    titleText?: string;
    maxTime?: number; // Maximum time in seconds to play the video
};

/**
 * Determines the video source type and returns the appropriate src for OffthreadVideo component
 * @param videoInput - Can be a local path or URL
 * @returns The appropriate src string for the OffthreadVideo component
 */
function getVideoSrc(videoInput: string): string {
    // Check if it's a URL (http/https)
    if (videoInput.startsWith('http://') || videoInput.startsWith('https://')) {
        return videoInput;
    }

    // Otherwise, treat it as a local file path
    return staticFile(videoInput);
}

export const VideoScreen = ({videoSource, titleText, maxTime}: VideoScreenProps) => {
  const {fps} = useVideoConfig();
  const defaultVideoSource = staticFile('videos/Big_Buck_Bunny_360_10s_1MB.mp4');
  // Process videoSource if provided, otherwise use default
  const videoSrc = (videoSource && videoSource.trim()) ? getVideoSrc(videoSource.trim()) : defaultVideoSource;
  
  return (
    <AbsoluteFill className="flex flex-col justify-between items-center gap-8">
      <OffthreadVideo 
        src={videoSrc} 
        className="w-full h-full object-cover"
        endAt={maxTime ? Math.round(maxTime * fps) : undefined} // Convert seconds to frames
      />
      {titleText && (
        <div className="absolute bottom-0 left-0 right-0 px-6 py-3 pb-8 bg-black bg-opacity-50">
          <h1 className="text-white text-center rounded-lg">{titleText}</h1>
        </div>
      )}
    </AbsoluteFill>
  );
};
