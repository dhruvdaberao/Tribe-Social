// import React from 'react';
// import { Story, User } from '../../types';
// import UserAvatar from '../common/UserAvatar';

// interface StoryFeedProps {
//     myStories: Story[];
//     followingUserStories: { user: User, stories: Story[] }[];
//     currentUser: User;
//     seenStoryAuthors: Set<string>;
//     onViewUserStories: (userId: string) => void;
// }

// const StoryFeed: React.FC<StoryFeedProps> = ({ myStories, followingUserStories, currentUser, seenStoryAuthors, onViewUserStories }) => {
//     if (myStories.length === 0 && followingUserStories.length === 0) {
//         return null;
//     }

//     const hasMyStory = myStories.length > 0;

//     return (
//         <div className="mb-6">
//             <div className="flex space-x-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
//                 {/* My Story */}
//                 {hasMyStory && (
//                     <StoryFeedItem
//                         user={currentUser}
//                         hasUnseen={true} // My story is always "unseen" in the context of the ring color
//                         onClick={() => onViewUserStories(currentUser.id)}
//                     />
//                 )}

//                 {/* Following Stories */}
//                 {followingUserStories.map(({ user }) => {
//                     const hasUnseen = !seenStoryAuthors.has(user.id);
//                     return (
//                         <StoryFeedItem
//                             key={user.id}
//                             user={user}
//                             hasUnseen={hasUnseen}
//                             onClick={() => onViewUserStories(user.id)}
//                         />
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };

// interface StoryFeedItemProps {
//     user: User;
//     hasUnseen: boolean;
//     onClick: () => void;
// }

// const StoryFeedItem: React.FC<StoryFeedItemProps> = ({ user, hasUnseen, onClick }) => (
//     <div className="flex flex-col items-center space-y-1 flex-shrink-0 w-20" onClick={onClick}>
//         <div className={`w-16 h-16 rounded-full p-0.5 transition-colors ${hasUnseen ? 'bg-accent' : 'bg-border'}`}>
//             <div className="p-0.5 bg-surface rounded-full">
//                 <UserAvatar user={user} className="w-full h-full" />
//             </div>
//         </div>
//         <p className="text-xs text-primary truncate w-full text-center">{user.name.split(' ')[0]}</p>
//     </div>
// );

// export default StoryFeed;






import React from 'react';
import { Story, User } from '../../types';
import UserAvatar from '../common/UserAvatar';

interface StoryFeedProps {
    myStories: Story[];
    followingUserStories: { user: User, stories: Story[] }[];
    currentUser: User;
    seenStoryAuthors: Set<string>;
    onViewUserStories: (userId: string) => void;
}

const StoryFeed: React.FC<StoryFeedProps> = ({ myStories, followingUserStories, currentUser, seenStoryAuthors, onViewUserStories }) => {
    if (myStories.length === 0 && followingUserStories.length === 0) {
        return null;
    }

    const hasMyStory = myStories.length > 0;

    return (
        <div className="mb-6">
            <div className="flex space-x-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
                {/* My Story */}
                {hasMyStory && (
                    <StoryFeedItem
                        user={currentUser}
                        hasUnseen={true} // My story is always "unseen" in the context of the ring color
                        onClick={() => onViewUserStories(currentUser.id)}
                    />
                )}

                {/* Following Stories */}
                {followingUserStories.map(({ user }) => {
                    const hasUnseen = !seenStoryAuthors.has(user.id);
                    return (
                        <StoryFeedItem
                            key={user.id}
                            user={user}
                            hasUnseen={hasUnseen}
                            onClick={() => onViewUserStories(user.id)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

interface StoryFeedItemProps {
    user: User;
    hasUnseen: boolean;
    onClick: () => void;
}

const StoryFeedItem: React.FC<StoryFeedItemProps> = ({ user, hasUnseen, onClick }) => (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0 w-20 cursor-pointer" onClick={onClick}>
        <div className={`w-16 h-16 rounded-full p-0.5 transition-colors ${hasUnseen ? 'bg-accent' : 'bg-border'}`}>
            <div className="w-full h-full p-0.5 bg-surface rounded-full">
                <UserAvatar user={user} className="w-full h-full" />
            </div>
        </div>
        <p className="text-xs text-primary truncate w-full text-center">{user.name.split(' ')[0]}</p>
    </div>
);

export default StoryFeed;