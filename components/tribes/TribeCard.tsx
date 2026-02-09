// import React from 'react';
// import { Tribe, User } from '../../types';
// import UserAvatar from '../common/UserAvatar';
// import { useSocket } from '../../contexts/SocketContext';

// interface TribeCardProps {
//     tribe: Tribe;
//     isMember: boolean;
//     currentUser: User;
//     onJoinToggle: (tribeId: string) => void;
//     onViewTribe: (tribe: Tribe) => void;
//     onEditTribe: (tribe: Tribe) => void;
// }

// const TribePlaceholderIcon = () => (
//     <div className="w-20 h-20 rounded-full mb-4 bg-background border border-border flex items-center justify-center text-secondary p-4">
//         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
//             <circle cx="9" cy="7" r="4"></circle>
//             <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
//             <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
//         </svg>
//     </div>
// );


// const TribeCard: React.FC<TribeCardProps> = ({ tribe, isMember, currentUser, onJoinToggle, onViewTribe, onEditTribe }) => {
//     const { unreadCounts } = useSocket();
//     const unreadCount = unreadCounts.tribes[tribe.id] || 0;

//     return (
//         <div className="bg-surface rounded-2xl shadow-md border border-border flex flex-col text-center items-center transition-transform transform hover:-translate-y-1 relative group">
//              {currentUser.id === tribe.owner && (
//                 <button 
//                     onClick={(e) => {
//                         e.stopPropagation();
//                         onEditTribe(tribe);
//                     }}
//                     className="absolute top-2 right-2 p-1.5 bg-surface/50 backdrop-blur-sm rounded-full text-secondary hover:text-primary hover:bg-background transition-colors z-10"
//                     aria-label="Edit Tribe"
//                 >
//                     <EditIcon />
//                 </button>
//             )}
//             <div className="w-full p-4 flex flex-col items-center text-center flex-grow cursor-pointer" onClick={() => onViewTribe(tribe)}>
//                 <div className="relative">
//                     {tribe.avatarUrl ? (
//                         <img 
//                             src={tribe.avatarUrl} 
//                             alt={tribe.name} 
//                             className="w-20 h-20 rounded-full mb-4 object-cover"
//                         />
//                     ) : (
//                         <TribePlaceholderIcon/>
//                     )}
//                     {unreadCount > 0 && (
//                         <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-surface text-white text-xs flex items-center justify-center">
//                             {unreadCount}
//                         </span>
//                     )}
//                 </div>
//                 <h3 className="font-bold text-lg text-primary">{tribe.name}</h3>
//                 <p className="text-sm text-secondary mb-2">{tribe.members.length.toLocaleString()} members</p>
//                 <p className="text-sm text-primary flex-grow mb-4 px-2 line-clamp-2">{tribe.description}</p>
//             </div>
//             <div className="p-4 pt-0 w-full flex items-center space-x-2">
//                  <button 
//                     onClick={() => onViewTribe(tribe)}
//                     className={`w-full font-semibold px-4 py-2 rounded-lg transition-colors text-sm bg-surface text-primary border border-border hover:bg-background`}
//                 >
//                     Chat
//                 </button>
//                 <button 
//                     onClick={(e) => {
//                         e.stopPropagation();
//                         onJoinToggle(tribe.id);
//                     }}
//                     className={`w-full font-semibold px-4 py-2 rounded-lg transition-colors text-sm ${
//                        isMember
//                        ? 'bg-surface text-red-500 border border-border hover:bg-red-500/10'
//                        : 'bg-accent text-accent-text hover:bg-accent-hover'
//                     }`}
//                 >
//                     {isMember ? 'Leave' : 'Join'}
//                 </button>
//             </div>
//         </div>
//     );
// };

// const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;

// export default TribeCard;






import React, { useState } from 'react';
import { Tribe, User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useSocket } from '../../contexts/SocketContext';

interface TribeCardProps {
    tribe: Tribe;
    isMember: boolean;
    currentUser: User;
    onJoinToggle: (tribeId: string) => void;
    onViewTribe: (tribe: Tribe) => void;
    onEditTribe: (tribe: Tribe) => void;
}

const TribePlaceholderIcon = () => (
    <div className="w-20 h-20 rounded-full mb-4 bg-background border border-border flex items-center justify-center text-secondary p-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    </div>
);


const TribeCard: React.FC<TribeCardProps> = ({ tribe, isMember, currentUser, onJoinToggle, onViewTribe, onEditTribe }) => {
    const { unreadCounts } = useSocket();
    const unreadCount = unreadCounts.tribes[tribe.id] || 0;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isOwner = currentUser.id === tribe.owner;

    return (
        <div className="bg-surface rounded-2xl shadow-md border border-border flex flex-col text-center items-center transition-transform transform hover:-translate-y-1 relative group">
            {/* Menu Button - Visible for everyone */}
            <div className="absolute top-2 right-2 z-20">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                    className="p-1.5 bg-surface/80 backdrop-blur-sm rounded-full text-secondary hover:text-primary hover:bg-background transition-colors border border-transparent hover:border-border"
                    aria-label="Tribe Options"
                >
                    <OptionsIcon />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-xl border border-border z-30 overflow-hidden text-left">
                        {isOwner && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTribe(tribe);
                                    setIsMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-sm text-primary hover:bg-background flex items-center gap-2 border-b border-border/50 transition-colors"
                            >
                                <EditIcon /> Edit Tribe
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                alert('Report feature coming soon!'); // Placeholder
                                setIsMenuOpen(false);
                            }}
                            className="w-full px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                        >
                            <FlagIcon /> Report Tribe
                        </button>
                    </div>
                )}
            </div>

            <div className="w-full p-4 flex flex-col items-center text-center flex-grow cursor-pointer" onClick={() => onViewTribe(tribe)}>
                <div className="relative">
                    {tribe.avatarUrl ? (
                        <img
                            src={tribe.avatarUrl}
                            alt={tribe.name}
                            className="w-20 h-20 rounded-full mb-4 object-cover"
                        />
                    ) : (
                        <TribePlaceholderIcon />
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-surface text-white text-xs flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-lg text-primary">{tribe.name}</h3>
                <p className="text-sm text-secondary mb-2">{tribe.members.length.toLocaleString()} members</p>
                <p className="text-sm text-primary flex-grow mb-4 px-2 line-clamp-2">{tribe.description}</p>
            </div>
            <div className="p-4 pt-0 w-full flex items-center space-x-2">
                {isMember && (
                    <button
                        onClick={() => onViewTribe(tribe)}
                        className={`w-full font-semibold px-4 py-2 rounded-lg transition-colors text-sm bg-surface text-primary border border-border hover:bg-background`}
                    >
                        Chat
                    </button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onJoinToggle(tribe.id);
                    }}
                    className={`w-full font-semibold px-4 py-2 rounded-lg transition-colors text-sm ${isMember
                            ? 'bg-surface text-red-500 border border-border hover:bg-red-500/10'
                            : 'bg-accent text-accent-text hover:bg-accent-hover'
                        }`}
                >
                    {isMember ? 'Leave' : 'Join'}
                </button>
            </div>
        </div>
    );
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const OptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const FlagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 9h6v6H9V9z" /></svg>; // Approximate flag

export default TribeCard;
