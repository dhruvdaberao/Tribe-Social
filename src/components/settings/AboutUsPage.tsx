import React from 'react';

const AboutUsPage: React.FC = () => {
  return (
    <div className="space-y-6 text-secondary leading-relaxed">
      <section>
        <h3 className="font-bold text-lg text-primary mb-2">Our Mission</h3>
        <p>
          Tribe was built on a simple idea: connection. In a world that's more digitally connected than ever, we wanted to create a space that fosters genuine community, meaningful conversations, and shared interests. Tribe is more than just a social media platform; it's a place to find your people, share your passions, and grow together.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-lg text-primary mb-2">A Note from the Creator</h3>
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-background p-4 rounded-lg">
            <img src="https://avatars.githubusercontent.com/u/98394436?v=4" alt="Dhruv Daberao" className="w-24 h-24 rounded-full border-2 border-accent object-cover"/>
            <div>
                 <p className="mb-2">
                    "Hey everyone! I'm Dhruv Daberao, the 21-year-old developer who poured my heart and soul into building Tribe. This project was born from my passion for creating vibrant online communities and pushing the boundaries of what a solo developer can achieve. I hope you enjoy using Tribe as much as I enjoyed building it!"
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <a href="https://dhruvdaberao.vercel.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">Portfolio</a>
                    <a href="https://www.linkedin.com/in/dhruvdaberao" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">LinkedIn</a>
                    <a href="https://github.com/dhruvdaberao" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">GitHub</a>
                </div>
            </div>
        </div>
      </section>
      
      <section>
        <h3 className="font-bold text-lg text-primary mb-2">Technology Stack</h3>
        <p>
          For the tech enthusiasts out there, Tribe is a full-stack MERN application (MongoDB, Express.js, React, Node.js) built with TypeScript and brought to life with real-time features using Socket.IO. The friendly AI assistant, Chuk, is powered by Google's Gemini API.
        </p>
      </section>
    </div>
  );
};

export default AboutUsPage;
