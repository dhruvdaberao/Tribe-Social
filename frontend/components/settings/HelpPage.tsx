
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/settings')} className="mb-6 flex items-center text-secondary hover:text-primary transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back
      </button>

      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
        <h1 className="text-2xl font-bold font-display text-primary mb-6">Help & Support</h1>

        <div className="space-y-6">
          <p className="text-secondary-text leading-relaxed">
            Need assistance? The Tribe team (and Psyduck!) are here to help.
          </p>

          <div className="bg-background p-6 rounded-xl border border-border">
            <h3 className="font-semibold text-primary mb-2 flex items-center">
              <Mail className="mr-2" size={20} /> Contact Support
            </h3>
            <p className="text-secondary text-sm mb-4">
              For account issues, bug reports, or general inquiries, please email us directly.
            </p>
            <a href="mailto:support@tribesocial.com" className="text-accent hover:underline font-medium">
              support@tribesocial.com
            </a>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-primary mb-3">Frequently Asked Questions</h3>
            <ul className="space-y-4 text-secondary-text text-sm">
              <li>
                <strong className="block text-primary mb-1">How do I verify my account?</strong>
                Currently, verification is invite-only or handled manually by admins.
              </li>
              <li>
                <strong className="block text-primary mb-1">Can I change my username?</strong>
                Yes, go to Settings &gt; Account &gt; Account Information.
              </li>
              <li>
                <strong className="block text-primary mb-1">Where is the dark mode toggle?</strong>
                Tap the sun/moon icon in the top header bar!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
