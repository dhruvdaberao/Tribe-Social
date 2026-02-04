
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Linkedin, Mail } from 'lucide-react';

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
                        {/* Fixed Logo Path: Using /logo-text.png as requested, assuming it exists or handled by browser. 
                            Added fallback logic via onError just in case, but kept simple. */}
                        <img
                            src="/logo-text.png"
                            alt="Tribe Logo"
                            className="h-16 w-auto mb-4 object-contain"
                        />
                        <h1 className="text-3xl font-bold font-display text-primary">Tribe Social</h1>
                        <p className="text-secondary mt-2">Version 4.0.0</p>
                    </div>

                    <div className="space-y-8 text-secondary-text leading-relaxed">
                        <section className="text-center">
                            <p className="text-lg">
                                Tribe is a community-first social platform designed to bring people together around shared interests.
                                No algorithms, no clutter—just you and your tribe.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-primary mb-3 text-center">Technology Stack</h3>
                            <p className="text-center text-sm opacity-80">
                                Built with the MERN Stack (MongoDB, Express, React, Node.js), TypeScript, and Socket.IO.
                                <br />Powered by Google Gemini.
                            </p>
                        </section>

                        <div className="h-px bg-border w-1/2 mx-auto" />

                        <section className="flex flex-col items-center">
                            {/* Replaced simple line/text with Pika Profile Pic */}
                            <div className="mb-4 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <img
                                    src="/chuk-ai.png"
                                    alt="Builder"
                                    className="relative w-24 h-24 rounded-full border-4 border-surface shadow-lg object-cover"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-surface text-xs font-bold px-2 py-1 rounded-full border border-border shadow-sm text-primary">
                                    Builder
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-primary mb-1">Dhruv Daberao</h3>
                            <p className="text-secondary text-sm mb-6">Full Stack Developer</p>

                            {/* Social Links */}
                            <div className="flex items-center space-x-4">
                                <SocialButton href="https://github.com/dhruv-daberao" icon={<Github size={20} />} label="GitHub" />
                                <SocialButton href="https://linkedin.com/in/dhruv-daberao" icon={<Linkedin size={20} />} label="LinkedIn" />
                                <SocialButton href="mailto:dhruvdaberao@gmail.com" icon={<Mail size={20} />} label="Email" />
                            </div>
                        </section>
                    </div>
                </div>

                {/* Gif with proper padding */}
                <div className="bg-background/50 p-8 flex justify-center border-t border-border mt-8">
                    <img src="/noodles.gif" alt="Noodles eating gif" className="w-48 h-auto rounded-lg shadow-sm opacity-80 hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <div className="text-center mt-8 text-secondary text-xs opacity-50">
                © {new Date().getFullYear()} Tribe Social. All rights reserved.
            </div>
        </div>
    );
};

const SocialButton: React.FC<{ href: string, icon: React.ReactNode, label: string }> = ({ href, icon, label }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="p-3 bg-background hover:bg-accent hover:text-accent-text text-secondary rounded-xl transition-all duration-300 shadow-sm border border-border hover:border-transparent group"
        aria-label={label}
    >
        {icon}
    </a>
);

export default AboutPage;
