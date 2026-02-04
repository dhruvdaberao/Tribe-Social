import React from 'react';
import { useNavigate } from 'react-router-dom';

const RulesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center text-secondary hover:text-primary transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
            </button>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
                <h1 className="text-3xl font-bold text-primary mb-6 font-display">Rules & Regulations</h1>

                <div className="space-y-8 text-primary">
                    <section>
                        <h2 className="text-xl font-bold text-accent mb-3">1. Respect & Harassment</h2>
                        <p className="leading-relaxed text-secondary-text">
                            We have a zero-tolerance policy for harassment, bullying, or hate speech.
                            Treat every member with respect. Disagreements are allowed, but personal attacks are not.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-accent mb-3">2. Inappropriate Content</h2>
                        <p className="leading-relaxed text-secondary-text">
                            Do not post content that is illegal, pornographic, violent, or promotes self-harm.
                            Such content will be removed immediately, and your account may be banned.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-accent mb-3">3. Spam & Self-Promotion</h2>
                        <p className="leading-relaxed text-secondary-text">
                            Avoid excessive posting of the same content. Self-promotion should be relevant and not disruptive to the community.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-accent mb-3">4. Reporting Violations</h2>
                        <p className="leading-relaxed text-secondary-text">
                            If you see something that violates these rules, use the <strong>Report</strong> button on the post or user profile.
                            Our moderation system (including our AI assistant Pika) automatically reviews reports.
                        </p>
                        <ul className="list-disc list-inside mt-2 text-secondary ml-4">
                            <li>5 reports on a post will automatically remove it.</li>
                            <li>15 reports on a user account may lead to automatic suspension.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-accent mb-3">5. Privacy</h2>
                        <p className="leading-relaxed text-secondary-text">
                            Do not share personal information of others without their consent. Respect the privacy of private tribes and messages.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-border text-center text-secondary text-sm">
                    <p>By using Tribe Social, you agree to abide by these rules.</p>
                    <p className="mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};

export default RulesPage;
