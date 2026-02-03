import React from 'react';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="py-4">
    <dt className="font-semibold text-primary">{question}</dt>
    <dd className="mt-2 text-secondary leading-relaxed">{answer}</dd>
  </div>
);

const HelpPage: React.FC = () => {
  return (
    <div className="divide-y divide-border">
      <FAQItem
        question="How do I create a post?"
        answer="On the 'Home' tab, you'll find a box at the top that says 'What's on your mind?'. Simply type your message, attach an image if you like, and hit the 'Post' button!"
      />
      <FAQItem
        question="What is a Tribe?"
        answer="A Tribe is a community or group chat centered around a specific topic, hobby, or interest. You can join existing Tribes from the 'Tribes' page or create your own to connect with like-minded people."
      />
      <FAQItem
        question="How can I find my friends?"
        answer="Head over to the 'Discover' page. You can use the search bar at the top to search for people by their name or username (e.g., @username)."
      />
       <FAQItem
        question="Who is Chuk?"
        answer="Chuk 🐣 is your friendly AI-powered guide on Tribe! You can chat with Chuk from the top navigation bar. Ask for help, creative ideas, or just say hi!"
      />
      <FAQItem
        question="How do I edit my profile?"
        answer="Go to your profile by clicking your avatar in the top-right corner. From there, you'll see an 'Edit Profile' button which allows you to change your name, bio, avatar, and banner images."
      />
      <FAQItem
        question="Is my data safe?"
        answer="Absolutely. We take your privacy seriously. All passwords are encrypted, and we will never share your personal information with third parties."
      />
    </div>
  );
};

export default HelpPage;
