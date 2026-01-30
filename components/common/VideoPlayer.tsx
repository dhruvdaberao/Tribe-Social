import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useGlobalVideoManager } from '../../hooks/useGlobalVideoManager';

interface VideoPlayerProps {
    src: string;
    className?: string;
    onPause?: () => void;
    onPlay?: () => void;
}

/**
 * Generate Cloudinary poster URL from video URL
 * Extracts first frame at 1s mark as thumbnail
 */
const getVideoPoster = (videoUrl: string): string => {
    // Cloudinary video URL pattern: .../video/upload/.../filename.mp4
    // Poster pattern: .../video/upload/so_1.0/filename.jpg
    if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/upload/')) {
        return videoUrl.replace('/video/upload/', '/video/upload/so_1.0/').replace(/\.(mp4|mov|webm)$/, '.jpg');
    }
    // Fallback: use video URL (browser will extract first frame)
    return videoUrl;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '', onPause, onPlay }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use global video manager to ensure only one video plays at a time
    useGlobalVideoManager(videoRef);

    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const posterUrl = getVideoPoster(src);

    // Format time as MM:SS
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle play/pause with lazy loading
    const togglePlayPause = () => {
        if (!videoRef.current) return;

        // Lazy load video on first play
        if (!isVideoLoaded) {
            videoRef.current.src = src;
            videoRef.current.load();
            setIsVideoLoaded(true);
            videoRef.current.play();
        } else {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    // Handle mute/unmute
    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(!isMuted);
    };

    // Handle fullscreen
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen();
        }
    };

    // Handle progress bar click
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !isVideoLoaded) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * videoRef.current.duration;
    };

    // Auto-hide controls
    const resetControlsTimeout = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        }
    };

    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => {
            setIsPlaying(true);
            onPlay?.();
        };

        const handlePause = () => {
            setIsPlaying(false);
            setShowControls(true);
            onPause?.();
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [onPlay, onPause]);

    // Intersection Observer for auto-pause
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting && isPlaying) {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
        };
    }, [isPlaying]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}
            onMouseMove={resetControlsTimeout}
            onClick={togglePlayPause}
        >
            <video
                ref={videoRef}
                poster={posterUrl}
                className="w-full h-auto max-h-[600px] object-contain"
                playsInline
                preload="none"
                muted={isMuted}
            />

            {/* Duration badge (shows when not playing or controls visible) */}
            {(!isPlaying || showControls) && duration > 0 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {formatTime(duration)}
                </div>
            )}

            {/* Play button overlay (shows when paused) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/90 shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-black ml-1" fill="black" />
                    </div>
                </div>
            )}

            {/* Custom controls */}
            {showControls && isVideoLoaded && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    {/* Progress bar */}
                    <div
                        className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlayPause();
                                }}
                                className="hover:opacity-80 transition-opacity"
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>

                            <span className="text-xs">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMute();
                                }}
                                className="hover:opacity-80 transition-opacity"
                            >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFullscreen();
                                }}
                                className="hover:opacity-80 transition-opacity"
                            >
                                <Maximize size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
