import React, { useEffect, useRef, useState } from 'react';

interface IntroSplashProps {
    onComplete: () => void;
}

const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect theme (same logic as index.html)
        const theme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const darkMode = theme === 'dark' || (!theme && prefersDark);
        setIsDark(darkMode);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Try to play with sound
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Autoplay with sound blocked, trying muted:', error);
                // If autoplay with sound fails, try muted (browsers are strict)
                video.muted = true;
                video.play().catch(e => {
                    console.error('Video play failed completely:', e);
                    // If video completely fails, skip intro
                    onComplete();
                });
            });
        }

        // Handle video end
        const handleEnded = () => {
            onComplete();
        };

        video.addEventListener('ended', handleEnded);

        // Fallback timeout (in case video never loads)
        const fallbackTimeout = setTimeout(() => {
            console.warn('Video timeout - forcing completion');
            onComplete();
        }, 4000); // 4 seconds (slightly longer than video)

        return () => {
            video.removeEventListener('ended', handleEnded);
            clearTimeout(fallbackTimeout);
        };
    }, [onComplete]);

    const videoSrc = isDark
        ? '/white-color-logo-intro-3s.mp4'
        : '/black-color-logo-intro-3s.mp4';

    const backgroundColor = isDark
        ? '#2C211B' // Dark theme background
        : '#FAF6F1'; // Light theme background

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
                style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain',
                }}
            />
        </div>
    );
};

export default IntroSplash;
