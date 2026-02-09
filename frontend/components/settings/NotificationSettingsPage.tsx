import React, { useEffect, useState } from 'react';
import { Bell, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../common/Toast';
import { subscribeToPush, unsubscribeFromPush, isSubscribedToPush } from '../../utils/pushNotifications';
import * as api from '../../api';

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
  const { currentUser, setCurrentUser } = useAuth();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushReady, setIsPushReady] = useState(false);

  useEffect(() => {
    if (currentUser?.notificationPrefs) {
      setPrefs({
        ...defaultPrefs,
        ...currentUser.notificationPrefs,
        pushTypes: { ...defaultPrefs.pushTypes, ...currentUser.notificationPrefs.pushTypes },
        emailTypes: { ...defaultPrefs.emailTypes, ...currentUser.notificationPrefs.emailTypes },
      });
    }
  }, [currentUser]);

  useEffect(() => {
    isSubscribedToPush().then(setIsPushReady).catch(() => setIsPushReady(false));
  }, []);

  const persistPrefs = async (nextPrefs: typeof prefs) => {
    setIsSaving(true);
    try {
      const { data } = await api.updateNotificationPrefs(nextPrefs);
      setPrefs(data.notificationPrefs);
      setCurrentUser((prev) => (prev ? { ...prev, notificationPrefs: data.notificationPrefs } : prev));
      toast.success('Notification preferences updated.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof prefs, value: boolean) => {
    const nextPrefs = { ...prefs, [key]: value };
    setPrefs(nextPrefs);
    persistPrefs(nextPrefs);
  };

  const handlePushToggle = async () => {
    const nextEnabled = !prefs.pushEnabled;
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
    handleToggle('pushEnabled', nextEnabled);
  };

  const handleEmailToggle = async () => {
    handleToggle('emailEnabled', !prefs.emailEnabled);
  };

  const handlePushTypeToggle = (type: keyof typeof prefs.pushTypes) => {
    const nextPrefs = {
      ...prefs,
      pushTypes: {
        ...prefs.pushTypes,
        [type]: !prefs.pushTypes[type],
      },
    };
    setPrefs(nextPrefs);
    persistPrefs(nextPrefs);
  };

  const handleEmailTypeToggle = (type: keyof typeof prefs.emailTypes) => {
    const nextPrefs = {
      ...prefs,
      emailTypes: {
        ...prefs.emailTypes,
        [type]: !prefs.emailTypes[type],
      },
    };
    setPrefs(nextPrefs);
    persistPrefs(nextPrefs);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-primary">Notifications</h1>
          <p className="text-sm text-secondary mt-1">
            Control which alerts you receive on your devices and via email.
          </p>
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
            <ToggleButton isOn={prefs.pushEnabled} onClick={handlePushToggle} disabled={isSaving} />
          </div>

          <div className={`space-y-3 ${prefs.pushEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <ToggleRow label="Direct messages" isOn={prefs.pushTypes.dm} onClick={() => handlePushTypeToggle('dm')} />
            <ToggleRow label="Tribe messages" isOn={prefs.pushTypes.tribe} onClick={() => handlePushTypeToggle('tribe')} />
            <ToggleRow label="Likes" isOn={prefs.pushTypes.likes} onClick={() => handlePushTypeToggle('likes')} />
            <ToggleRow label="Comments" isOn={prefs.pushTypes.comments} onClick={() => handlePushTypeToggle('comments')} />
            <ToggleRow label="Follows" isOn={prefs.pushTypes.follows} onClick={() => handlePushTypeToggle('follows')} />
            <ToggleRow label="Tribe joins" isOn={prefs.pushTypes.tribeJoins} onClick={() => handlePushTypeToggle('tribeJoins')} />
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
            <ToggleButton isOn={prefs.emailEnabled} onClick={handleEmailToggle} disabled={isSaving} />
          </div>

          <div className={`space-y-3 ${prefs.emailEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <ToggleRow label="New device login" isOn={prefs.emailTypes.newDevice} onClick={() => handleEmailTypeToggle('newDevice')} />
            <ToggleRow label="Daily digest" isOn={prefs.emailTypes.digest} onClick={() => handleEmailTypeToggle('digest')} />
            <ToggleRow label="Moderation alerts" isOn={prefs.emailTypes.moderation} onClick={() => handleEmailTypeToggle('moderation')} />
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
