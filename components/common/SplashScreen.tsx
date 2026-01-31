import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const { theme } = useTheme();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFading, setIsFading] = useState(false);

    // Determine video source based on Strict Theme Mapping
    // LIGHT theme -> dark-color-logo-intro-3s.mp4
    // DARK theme -> light-color-logo-intro-3s.mp4
    const videoSrc = theme === 'dark'
        ? '/light-color-logo-intro-3s.mp4'
        : '/dark-color-logo-intro-3s.mp4';

    useEffect(() => {
        // Fallback: If video fails or takes too long, force finish after 3.5s
        const timer = setTimeout(() => {
            handleFinish();
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const handleFinish = () => {
        setIsFading(true);
        // Wait for fade out animation (e.g. 500ms) then call onFinish
        setTimeout(() => {
            onFinish();
        }, 500);
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
            <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover md:object-contain max-w-sm"
                autoPlay
                muted
                playsInline
                onEnded={handleFinish}
                onError={(e) => {
                    console.error("Splash video error:", e);
                    handleFinish();
                }}
            />
        </div>
    );
};

export default SplashScreen;
