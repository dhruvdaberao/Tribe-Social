
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, UserX, MessageSquare } from 'lucide-react';

const RulesPoliciesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
                <ArrowLeft size={20} className="mr-2" /> Back
            </button>

            <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <Shield className="text-accent" size={32} />
                    <h1 className="text-2xl font-bold font-display text-primary">Rules & Policies</h1>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-bold text-primary mb-3">Community Standards</h2>
                        <p className="text-secondary-text leading-relaxed">
                            Tribe is a space for genuine connection. We expect all members to treat each other with respect and kindness.
                            Harassment, hate speech, bullying, and illegal content are strictly prohibited.
                        </p>
                    </section>

                    <div className="h-px bg-border w-full" />

                    <section>
                        <h2 className="text-lg font-bold text-primary mb-3 flex items-center">
                            <AlertTriangle className="mr-2 text-yellow-500" size={20} /> Reporting Policy
                        </h2>
                        <p className="text-secondary-text leading-relaxed mb-3">
                            We rely on our community to help maintain a safe environment. You can report posts or users that violate our guidelines directly from the app.
                        </p>
                        <div className="bg-background p-4 rounded-xl border border-border">
                            <h3 className="font-semibold text-primary text-sm mb-2">How we handle reports:</h3>
                            <ul className="space-y-2 text-sm text-secondary list-disc list-inside">
                                <li>Reports are reviewed by our automated systems and moderation team.</li>
                                <li>Content found to violate our rules will be removed.</li>
                                <li>Repeat violations may result in account suspension or permanent banning.</li>
                            </ul>
                            <p className="text-xs text-secondary mt-3 italic">
                                Note: Our system automatically flags and acts on high volumes of reports to prevent harm.
                            </p>
                        </div>
                    </section>

                    <div className="h-px bg-border w-full" />

                    <section>
                        <h2 className="text-lg font-bold text-primary mb-3 flex items-center">
                            <UserX className="mr-2 text-red-500" size={20} /> Blocking & Safety
                        </h2>
                        <p className="text-secondary-text leading-relaxed">
                            If you encounter someone you don't wish to interact with, you can use the <strong>Block</strong> feature on their profile.
                            Blocked users cannot see your posts, message you, or interact with you on Tribe.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-6 border-t border-border text-center text-secondary text-xs">
                    Last updated: {new Date().toLocaleDateString()}
                </div>

                <div className="flex justify-center mt-12 opacity-80 hover:opacity-100 transition-opacity">
                    <img src="/noodles.gif" alt="Tribe Mascot" className="w-40 h-auto rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default RulesPoliciesPage;
