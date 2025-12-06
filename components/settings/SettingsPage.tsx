


// import React, { useState } from 'react';
// import { User } from '../../types';
// import BlockedListModal from '../profile/BlockedListModal';
// import HelpPage from './HelpPage';
// import AboutUsPage from './AboutUsPage';

// interface SettingsPageProps {
//   currentUser: User;
//   allUsers: User[];
//   onLogout: () => void;
//   onDeleteAccount: () => void;
//   onToggleBlock: (targetUserId: string) => void;
//   onBack: () => void;
// }

// type SettingsTab = 'Account' | 'Help' | 'About';

// const SettingsPage: React.FC<SettingsPageProps> = (props) => {
//   const { currentUser, allUsers, onLogout, onDeleteAccount, onToggleBlock, onBack } = props;
//   const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
//   const [isBlockedModalOpen, setBlockedModalOpen] = useState(false);
//   const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

//   const renderContent = () => {
//     switch (activeTab) {
//       case 'Account':
//         return (
//           <>
//             <SettingsButton icon={<BlockIcon/>} text="Blocked Users" detail={`${(currentUser.blockedUsers || []).length} users`} onClick={() => setBlockedModalOpen(true)} />
//             <SettingsButton icon={<LogoutIcon/>} text="Logout" onClick={onLogout} />
//             <SettingsButton icon={<TrashIcon/>} text="Delete Account" onClick={() => setDeleteConfirmOpen(true)} isDestructive />
//           </>
//         );
//       case 'Help':
//         return <HelpPage />;
//       case 'About':
//         return <AboutUsPage />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="h-full flex flex-col md:flex-row bg-surface md:rounded-2xl md:border md:border-border md:shadow-lg overflow-hidden">
//       {/* Sidebar */}
//       <div className="flex-shrink-0 md:w-64 border-b md:border-b-0 md:border-r border-border p-4">
//         <div className="flex items-center space-x-3 mb-6">
//             <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-background rounded-full"><BackIcon /></button>
//             <h1 className="text-2xl font-bold font-display text-primary">Settings</h1>
//         </div>
//         <nav className="space-y-1">
//           <NavItem text="Account" icon={<UserIcon />} isActive={activeTab === 'Account'} onClick={() => setActiveTab('Account')} />
//           <NavItem text="Help & Support" icon={<HelpIcon />} isActive={activeTab === 'Help'} onClick={() => setActiveTab('Help')} />
//           <NavItem text="About Tribe" icon={<InfoIcon />} isActive={activeTab === 'About'} onClick={() => setActiveTab('About')} />
//         </nav>
//       </div>

//       {/* Content */}
//       <div className="flex-1 p-4 md:p-8 overflow-y-auto">
//         <img src="/noodles.gif" alt="Noodles eating gif" className="w-full max-w-xs mx-auto rounded-lg mb-8 shadow-md" />
//         <h2 className="text-2xl font-bold font-display text-primary mb-6">{activeTab}</h2>
//         <div className="space-y-4">
//           {renderContent()}
//         </div>
//       </div>
      
//       {isBlockedModalOpen && <BlockedListModal userIds={currentUser.blockedUsers || []} allUsers={allUsers} onClose={() => setBlockedModalOpen(false)} onToggleBlock={onToggleBlock}/>}
//       {isDeleteConfirmOpen && <DeleteAccountModal onClose={() => setDeleteConfirmOpen(false)} onConfirm={onDeleteAccount} />}
//     </div>
//   );
// };

// const NavItem: React.FC<{text: string, icon: React.ReactNode, isActive: boolean, onClick: () => void}> = ({text, icon, isActive, onClick}) => (
//     <button onClick={onClick} className={`w-full flex items-center space-x-3 p-2.5 rounded-lg font-semibold text-left transition-colors ${isActive ? 'bg-accent text-accent-text' : 'text-primary hover:bg-background'}`}>
//         <span className="w-6 h-6">{icon}</span>
//         <span>{text}</span>
//     </button>
// )

// const SettingsButton: React.FC<{icon: React.ReactNode, text: string, detail?: string, onClick: () => void, isDestructive?: boolean}> = ({icon, text, detail, onClick, isDestructive}) => (
//     <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isDestructive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-background hover:bg-border'}`}>
//         <div className="flex items-center space-x-4">
//             <span className="w-6 h-6">{icon}</span>
//             <span className="font-semibold">{text}</span>
//         </div>
//         <div className="flex items-center space-x-2 text-secondary">
//             {detail && <span>{detail}</span>}
//             <span className="w-5 h-5"><ChevronRightIcon /></span>
//         </div>
//     </button>
// )

// const DeleteAccountModal: React.FC<{onClose: () => void, onConfirm: () => void}> = ({ onClose, onConfirm }) => (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
//             <h2 className="text-xl font-bold text-primary">Delete Account</h2>
//             <p className="text-secondary my-4">Are you sure you want to permanently delete your account and all of your data? This action is irreversible.</p>
//             <div className="flex justify-end space-x-4 mt-6">
//                 <button onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button>
//                 <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700">Confirm Delete</button>
//             </div>
//         </div>
//     </div>
// );

// // ICONS
// const Icon: React.FC<{children: React.ReactNode}> = ({children}) => <>{children}</>;
// const UserIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></Icon>;
// const HelpIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></Icon>;
// const InfoIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg></Icon>;
// const BlockIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></Icon>;
// const LogoutIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg></Icon>;
// const TrashIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 00-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></Icon>;
// const ChevronRightIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></Icon>;
// const BackIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></Icon>;

// export default SettingsPage;




import React, { useState } from 'react';
import { User } from '../../types';
import BlockedListModal from '../profile/BlockedListModal';
import HelpPage from './HelpPage';
import AboutUsPage from './AboutUsPage';

interface SettingsPageProps {
  currentUser: User;
  allUsers: User[];
  onLogout: () => void;
  onDeleteAccount: () => void;
  onToggleBlock: (targetUserId: string) => void;
  onBack: () => void;
}

type SettingsTab = 'Account' | 'Help' | 'About';

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
  const { currentUser, allUsers, onLogout, onDeleteAccount, onToggleBlock, onBack } = props;
  const [activeTab, setActiveTab] = useState<SettingsTab>('Account');
  const [isBlockedModalOpen, setBlockedModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'Account':
        return (
          <>
            <SettingsButton icon={<BlockIcon/>} text="Blocked Users" detail={`${(currentUser.blockedUsers || []).length} users`} onClick={() => setBlockedModalOpen(true)} />
            <SettingsButton icon={<LogoutIcon/>} text="Logout" onClick={onLogout} />
            <SettingsButton icon={<TrashIcon/>} text="Delete Account" onClick={() => setDeleteConfirmOpen(true)} isDestructive />
          </>
        );
      case 'Help':
        return <HelpPage />;
      case 'About':
        return <AboutUsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-surface md:rounded-2xl md:border md:border-border md:shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 md:w-64 border-b md:border-b-0 md:border-r border-border p-4">
        <div className="flex items-center space-x-3 mb-6">
            <button onClick={onBack} className="p-2 -ml-2 text-primary hover:bg-background rounded-full"><BackIcon /></button>
            <h1 className="text-2xl font-bold font-display text-primary">Settings</h1>
        </div>
        <nav className="space-y-1">
          <NavItem text="Account" icon={<UserIcon />} isActive={activeTab === 'Account'} onClick={() => setActiveTab('Account')} />
          <NavItem text="Help & Support" icon={<HelpIcon />} isActive={activeTab === 'Help'} onClick={() => setActiveTab('Help')} />
          <NavItem text="About Tribe" icon={<InfoIcon />} isActive={activeTab === 'About'} onClick={() => setActiveTab('About')} />
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <img src="/noodles.gif" alt="Noodles eating gif" className="w-full max-w-xs mx-auto rounded-lg mb-8 shadow-md" />
        <h2 className="text-2xl font-bold font-display text-primary mb-6">{activeTab}</h2>
        <div className="space-y-4">
          {renderContent()}
        </div>
      </div>
      
      {isBlockedModalOpen && <BlockedListModal userIds={currentUser.blockedUsers || []} allUsers={allUsers} onClose={() => setBlockedModalOpen(false)} onToggleBlock={onToggleBlock}/>}
      {isDeleteConfirmOpen && <DeleteAccountModal onClose={() => setDeleteConfirmOpen(false)} onConfirm={onDeleteAccount} />}
    </div>
  );
};

const NavItem: React.FC<{text: string, icon: React.ReactNode, isActive: boolean, onClick: () => void}> = ({text, icon, isActive, onClick}) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 p-2.5 rounded-lg font-semibold text-left transition-colors ${isActive ? 'bg-accent text-accent-text' : 'text-primary hover:bg-background'}`}>
        <span className="w-6 h-6">{icon}</span>
        <span>{text}</span>
    </button>
)

const SettingsButton: React.FC<{icon: React.ReactNode, text: string, detail?: string, onClick: () => void, isDestructive?: boolean}> = ({icon, text, detail, onClick, isDestructive}) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${isDestructive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-background hover:bg-border'}`}>
        <div className="flex items-center space-x-4">
            <span className="w-6 h-6">{icon}</span>
            <span className="font-semibold">{text}</span>
        </div>
        <div className="flex items-center space-x-2 text-secondary">
            {detail && <span>{detail}</span>}
            <span className="w-5 h-5"><ChevronRightIcon /></span>
        </div>
    </button>
)

const DeleteAccountModal: React.FC<{onClose: () => void, onConfirm: () => void}> = ({ onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 border border-border">
            <h2 className="text-xl font-bold text-primary">Delete Account</h2>
            <p className="text-secondary my-4">Are you sure you want to permanently delete your account and all of your data? This action is irreversible.</p>
            <div className="flex justify-end space-x-4 mt-6">
                <button onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button>
                <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700">Confirm Delete</button>
            </div>
        </div>
    </div>
);

// ICONS
const Icon: React.FC<{children: React.ReactNode}> = ({children}) => <>{children}</>;
const UserIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></Icon>;
const HelpIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></Icon>;
const InfoIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg></Icon>;
const BlockIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></Icon>;
const LogoutIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg></Icon>;
const TrashIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09a2.09 2.09 0 00-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></Icon>;
const ChevronRightIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></Icon>;
const BackIcon = () => <Icon><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></Icon>;

export default SettingsPage;