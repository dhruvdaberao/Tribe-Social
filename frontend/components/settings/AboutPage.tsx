
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back
            </button>

            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <img
                            src="/logo-text.png"
                            alt="Tribe Logo"
                            className="h-16 w-auto mb-4 object-contain"
                        />
                        <h1 className="text-3xl font-bold font-display text-primary">Tribe Social</h1>
                        <p className="text-secondary mt-2">Version 4.0.0</p>
                    </div>

                    <div className="space-y-10 text-secondary-text leading-relaxed">
                        {/* Description */}
                        <section className="text-center">
                            <p className="text-lg">
                                Tribe is a community-first social platform designed to bring people together around shared interests.
                                No algorithms, no clutter—just you and your tribe.
                            </p>
                        </section>

                        {/* Note from Creator Section */}
                        <section>
                            <h3 className="text-xl font-bold text-primary mb-4">A Note from the Creator</h3>
                            <div className="bg-[#1e1c19] p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start border border-border/50">
                                <div className="flex-shrink-0">
                                    <img
                                        src="/pika.png"
                                        alt="Dhruv / Pika"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-border/20 shadow-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-300 italic mb-4 leading-relaxed text-sm">
                                        "Hey everyone! I'm Dhruv Daberao, the 21-year-old developer who poured my heart and soul into building Tribe. This project was born from my passion for creating vibrant online communities and pushing the boundaries of what a solo developer can achieve. I hope you enjoy using Tribe as much as I enjoyed building it!"
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                                        {/* User asked for Portfolio, LinkedIn, GitHub. I will put Mailto on 'Email' but label it 'Portfolio' if I must? 
                                           No, I'll allow myself to correct 'Portfolio' to 'Email' for clarity as discussed, or use 'Portfolio' if I had a link. 
                                           Since I don't, I'll use 'Email'. 
                                        */}
                                        <a href="mailto:dhruvdaberao@gmail.com" className="text-accent hover:text-accent-hover transition-colors">Email</a>
                                        <a href="https://www.linkedin.com/in/dhruvdaberao" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors">LinkedIn</a>
                                        <a href="https://github.com/dhruvdaberao" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover transition-colors">GitHub</a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Tech Stack */}
                        <section>
                            <h3 className="text-xl font-bold text-primary mb-3">Technology Stack</h3>
                            <p className="text-secondary-text text-sm opacity-90 leading-relaxed">
                                For the tech enthusiasts out there, Tribe is a full-stack MERN application (MongoDB, Express.js, React, Node.js) built with TypeScript and brought to life with real-time features using Socket.IO. The friendly AI assistant, Chuk, is powered by Google's Gemini API.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Footer GIF */}
                <div className="flex justify-center mt-8 pb-8 opacity-80 hover:opacity-100 transition-opacity">
                    <img src="/noodles.gif" alt="Noodles eating gif" className="w-48 h-auto rounded-lg" />
                </div>
            </div>

            <div className="text-center mt-8 text-secondary text-xs opacity-50">
                © {new Date().getFullYear()} Tribe Social. All rights reserved.
            </div>
        </div>
    );
};

export default AboutPage;
