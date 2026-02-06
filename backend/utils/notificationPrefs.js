export const defaultNotificationPrefs = {
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

export const normalizeNotificationPrefs = (prefs = {}) => {
  const pushTypes = prefs.pushTypes || {};
  const emailTypes = prefs.emailTypes || {};

  return {
    pushEnabled: typeof prefs.pushEnabled === 'boolean' ? prefs.pushEnabled : defaultNotificationPrefs.pushEnabled,
    emailEnabled: typeof prefs.emailEnabled === 'boolean' ? prefs.emailEnabled : defaultNotificationPrefs.emailEnabled,
    pushTypes: {
      dm: typeof pushTypes.dm === 'boolean' ? pushTypes.dm : defaultNotificationPrefs.pushTypes.dm,
      tribe: typeof pushTypes.tribe === 'boolean' ? pushTypes.tribe : defaultNotificationPrefs.pushTypes.tribe,
      likes: typeof pushTypes.likes === 'boolean' ? pushTypes.likes : defaultNotificationPrefs.pushTypes.likes,
      comments: typeof pushTypes.comments === 'boolean' ? pushTypes.comments : defaultNotificationPrefs.pushTypes.comments,
      follows: typeof pushTypes.follows === 'boolean' ? pushTypes.follows : defaultNotificationPrefs.pushTypes.follows,
      tribeJoins: typeof pushTypes.tribeJoins === 'boolean' ? pushTypes.tribeJoins : defaultNotificationPrefs.pushTypes.tribeJoins,
    },
    emailTypes: {
      newDevice: typeof emailTypes.newDevice === 'boolean' ? emailTypes.newDevice : defaultNotificationPrefs.emailTypes.newDevice,
      digest: typeof emailTypes.digest === 'boolean' ? emailTypes.digest : defaultNotificationPrefs.emailTypes.digest,
      moderation: typeof emailTypes.moderation === 'boolean' ? emailTypes.moderation : defaultNotificationPrefs.emailTypes.moderation,
    },
  };
};

export const isPushEnabledFor = (user, type) => {
  const prefs = normalizeNotificationPrefs(user?.notificationPrefs || {});
  return Boolean(prefs.pushEnabled && prefs.pushTypes?.[type]);
};

export const isEmailEnabledFor = (user, type) => {
  const prefs = normalizeNotificationPrefs(user?.notificationPrefs || {});
  return Boolean(prefs.emailEnabled && prefs.emailTypes?.[type]);
};
