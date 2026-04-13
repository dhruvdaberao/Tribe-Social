import React, { useEffect, useState } from 'react';
import { Bell, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../common/Toast';
import { subscribeToPush, unsubscribeFromPush, isSubscribedToPush } from '../../utils/pushNotifications';
import * as api from '../../api';
import { useNavigate } from 'react-router-dom';

const defaultPrefs = {
  pushEnabled: true,
  emailEnabled: true,
  pushTypes: {
    dm: true,
    tribe: true,
    likes: true,
    comments: true,
    follows: true,
    tribeJoins: true,
  },
  emailTypes: {
    newDevice: true,
    digest: false,
    moderation: true,
  },
};

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushPrefs, setPushPrefs] = useState({
    directMessages: true,
    tribeMessages: true,
    likes: true,
    comments: true,
    follows: true,
    tribeJoins: true,
  });
  const [emailPrefs, setEmailPrefs] = useState(defaultPrefs.emailTypes); // Keep email as is or normalize
  const [isSaving, setIsSaving] = useState(false);
  const [isPushReady, setIsPushReady] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (typeof currentUser.pushNotifications === 'boolean') {
        setPushEnabled(currentUser.pushNotifications);
      }
      if (currentUser.pushPrefs) {
        setPushPrefs(prev => ({ ...prev, ...currentUser.pushPrefs }));
      }
      if (currentUser.notificationPrefs?.emailTypes) {
        setEmailPrefs(currentUser.notificationPrefs.emailTypes);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    isSubscribedToPush().then(setIsPushReady).catch(() => setIsPushReady(false));
  }, []);

  const persistPushSettings = async (settings: { pushNotifications?: boolean; pushPrefs?: any }) => {
    setIsSaving(true);
    try {
      const { data } = await api.updatePushSettings(settings);
      setCurrentUser((prev) => (prev ? { 
        ...prev, 
        pushNotifications: data.pushNotifications,
        pushPrefs: data.pushPrefs 
      } : prev));
      toast.success('Push preferences updated.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const persistEmailSettings = async (emailTypes: any) => {
    setIsSaving(true);
    try {
      const { data } = await api.updateNotificationPrefs({ emailTypes });
      setCurrentUser((prev) => (prev ? { 
        ...prev, 
        notificationPrefs: { ...prev.notificationPrefs!, emailTypes: data.notificationPrefs.emailTypes } 
      } : prev));
      toast.success('Email preferences updated.');
    } catch (error: any) {
      toast.error('Failed to update email preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async () => {
    const nextEnabled = !pushEnabled;
    if (nextEnabled) {
      const subscribed = await subscribeToPush();
      if (!subscribed) {
        toast.error('Push permissions are blocked. Enable them in your browser settings.');
        return;
      }
      setIsPushReady(true);
    } else {
      await unsubscribeFromPush();
      setIsPushReady(false);
    }
    setPushEnabled(nextEnabled);
    persistPushSettings({ pushNotifications: nextEnabled });
  };

  const handlePushTypeToggle = (type: keyof typeof pushPrefs) => {
    const nextPrefs = {
      ...pushPrefs,
      [type]: !pushPrefs[type],
    };
    setPushPrefs(nextPrefs);
    persistPushSettings({ pushPrefs: nextPrefs });
  };

  const handleEmailTypeToggle = (type: keyof typeof emailPrefs) => {
    const nextPrefs = {
      ...emailPrefs,
      [type]: !emailPrefs[type],
    };
    setEmailPrefs(nextPrefs);
    persistEmailSettings(nextPrefs);
  };

  return (
    <div className="h-[calc(var(--vvh,100dvh)-4rem)] md:h-auto min-h-0 overflow-hidden">
      <div className="mx-auto h-full max-w-2xl overflow-y-auto px-4 py-6 md:py-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-6">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ fontSize: '20px', marginRight: '10px', background: 'transparent', border: 'none', color: '#f5e6d8', cursor: 'pointer' }}>
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold font-display text-primary">Notifications</h1>
            <p className="text-sm text-secondary mt-1">
              Control which alerts you receive on your devices and via email.
            </p>
          </div>
        </div>

        <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-accent/10 text-accent">
                <Bell size={20} />
              </span>
              <div>
                <p className="font-semibold text-primary">Push notifications</p>
                <p className="text-sm text-secondary">
                  {isPushReady ? 'Enabled on this device' : 'Enable to receive alerts'}
                </p>
              </div>
            </div>
            <ToggleButton isOn={pushEnabled} onClick={handlePushToggle} disabled={isSaving} />
          </div>
          
          <div className={`space-y-3 ${pushEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <ToggleRow label="Direct messages" isOn={pushPrefs.directMessages} onClick={() => handlePushTypeToggle('directMessages')} />
            <ToggleRow label="Tribe messages" isOn={pushPrefs.tribeMessages} onClick={() => handlePushTypeToggle('tribeMessages')} />
            <ToggleRow label="Likes" isOn={pushPrefs.likes} onClick={() => handlePushTypeToggle('likes')} />
            <ToggleRow label="Comments" isOn={pushPrefs.comments} onClick={() => handlePushTypeToggle('comments')} />
            <ToggleRow label="Follows" isOn={pushPrefs.follows} onClick={() => handlePushTypeToggle('follows')} />
            <ToggleRow label="Tribe joins" isOn={pushPrefs.tribeJoins} onClick={() => handlePushTypeToggle('tribeJoins')} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-background/60 p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-accent/10 text-accent">
                <Mail size={20} />
              </span>
              <div>
                <p className="font-semibold text-primary">Email notifications</p>
                <p className="text-sm text-secondary">Security and digest updates</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <ToggleRow label="New device login" isOn={emailPrefs.newDevice} onClick={() => handleEmailTypeToggle('newDevice')} />
            <ToggleRow label="Daily digest" isOn={emailPrefs.digest} onClick={() => handleEmailTypeToggle('digest')} />
            <ToggleRow label="Moderation alerts" isOn={emailPrefs.moderation} onClick={() => handleEmailTypeToggle('moderation')} />
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm text-secondary">
          <ShieldAlert size={18} className="text-accent mt-0.5" />
          <p>
            Push notifications require browser permission. If you previously blocked them, use your browser settings
            to re-enable.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; isOn: boolean; onClick: () => void }> = ({ label, isOn, onClick }) => (
  <div className="flex items-center justify-between px-4">
    <span className="text-sm font-medium text-primary">{label}</span>
    <ToggleButton isOn={isOn} onClick={onClick} />
  </div>
);

const ToggleButton: React.FC<{ isOn: boolean; onClick: () => void; disabled?: boolean }> = ({
  isOn,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOn ? 'bg-accent' : 'bg-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={isOn}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-1'}`}
    />
  </button>
);

export default NotificationSettingsPage;
