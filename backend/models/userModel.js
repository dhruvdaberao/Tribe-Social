import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const defaultNotificationPrefs = {
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

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    bio: { type: String, default: '' },
    // Deprecated Arrays (Kept for migration safety, will not be used in new logic)
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // New Scalable Count Fields
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Moderation
    isAdmin: { type: Boolean, default: false },
    isSuperAdmin: { type: Boolean, default: false },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who reported this account
    isBanned: { type: Boolean, default: false },
    bannedAt: { type: Date },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isHidden: { type: Boolean, default: false },
    hiddenAt: { type: Date },
    hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDisabled: { type: Boolean, default: false },
    disabledAt: { type: Date },
    disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disabledReason: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModerationAt: { type: Date },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    emailPrefs: {
      newDeviceLogin: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      moderationAlerts: { type: Boolean, default: true },
    },
    notificationPrefs: {
      type: Object,
      default: () => ({
        ...defaultNotificationPrefs,
        pushTypes: { ...defaultNotificationPrefs.pushTypes },
        emailTypes: { ...defaultNotificationPrefs.emailTypes },
      }),
    },
    lastLoginMeta: {
      lastIp: { type: String, default: '' },
      lastUserAgent: { type: String, default: '' },
      lastLoginAt: { type: Date },
      lastDeviceHash: { type: String, default: '' },
    },
    fcmToken: {
      type: String,
      default: null,
      index: true,
    },
    fcmTokenUpdatedAt: {
      type: Date,
      default: null,
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    pushPrefs: {
      directMessages: { type: Boolean, default: true },
      tribeMessages: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      tribeJoins: { type: Boolean, default: true }
    },
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    if (returnedObject._id) {
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
    }
    delete returnedObject.__v;
    delete returnedObject.password;
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
