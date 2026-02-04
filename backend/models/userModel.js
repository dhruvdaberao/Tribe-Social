import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who reported this account
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
