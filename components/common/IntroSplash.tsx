import React, { useEffect, useRef } from 'react';

interface IntroSplashProps {
    theme: 'light' | 'dark';
    onComplete: () => void;
}

const IntroSplash: React.FC<IntroSplashProps> = ({ theme, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Ensure video plays with audio
            video.play().catch(err => {
                console.warn('Video autoplay failed:', err);
            });
        }
    }, []);

    const handleVideoEnd = () => {
        onComplete();
    };

    const backgroundColor = theme === 'light' ? '#F4EFE9' : '#2B1F18';
    const videoSrc = theme === 'light' ? '/light-theme.mp4' : '/dark-theme.mp4';

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <video
                ref={videoRef}
                src={videoSrc}
                autoPlay
                playsInline
                muted={false}
                onEnded={handleVideoEnd}
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
};

export default IntroSplash;
