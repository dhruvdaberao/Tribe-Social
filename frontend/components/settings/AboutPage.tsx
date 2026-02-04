
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back
            </button>

            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <img src="/logo-text.png" alt="Tribe Logo" className="h-12 w-auto mb-4 opacity-90" />
                        <h1 className="text-2xl font-bold font-display text-primary">About Tribe</h1>
                        <p className="text-secondary mt-2">Version 4.0.0</p>
                    </div>

                    <div className="space-y-6 text-secondary-text leading-relaxed">
                        <p>
                            Tribe is a community-first social platform designed to bring people together around shared interests.
                            No algorithms, no clutter—just you and your tribe.
                        </p>

                        <div>
                            <h3 className="text-lg font-bold text-primary mb-2">Technology Stack</h3>
                            <p>
                                For the tech enthusiasts out there, Tribe is a full-stack MERN application (MongoDB, Express.js, React, Node.js)
                                built with TypeScript and brought to life with real-time features using Socket.IO.
                                The friendly AI assistant, Chuk, is powered by Google's Gemini API.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-primary mb-2">Created By</h3>
                            <p>
                                Built with ❤️ and ☕ by <strong>Dhruv Daberao</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gif with proper padding to show fully */}
                <div className="bg-background p-8 flex justify-center border-t border-border">
                    <img src="/noodles.gif" alt="Noodles eating gif" className="w-48 h-auto rounded-lg shadow-sm" />
                </div>
            </div>

            <div className="text-center mt-8 text-secondary text-sm">
                © {new Date().getFullYear()} Tribe Social. All rights reserved.
            </div>
        </div>
    );
};

export default AboutPage;
