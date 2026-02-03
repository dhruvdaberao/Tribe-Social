import { useEffect } from 'react';

// Global video manager - ensures only one video plays at a time
let currentlyPlayingVideo: HTMLVideoElement | null = null;

export const useGlobalVideoManager = (videoRef: React.RefObject<HTMLVideoElement>) => {
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => {
            // Pause any other currently playing video
            if (currentlyPlayingVideo && currentlyPlayingVideo !== video) {
                currentlyPlayingVideo.pause();
            }
            currentlyPlayingVideo = video;
        };

        const handlePause = () => {
            // Clear reference if this video was the current one
            if (currentlyPlayingVideo === video) {
                currentlyPlayingVideo = null;
            }
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);

            // Clear reference on unmount
            if (currentlyPlayingVideo === video) {
                currentlyPlayingVideo = null;
            }
        };
    }, [videoRef]);
};
