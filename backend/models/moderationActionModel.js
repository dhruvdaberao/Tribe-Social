import mongoose from 'mongoose';

const moderationActionSchema = mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['post', 'user'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    actionType: {
      type: String,
      enum: ['hide', 'unhide', 'delete', 'restore', 'warn', 'dismiss', 'ban', 'unban'],
      required: true,
      index: true,
    },
    reason: { type: String, default: '' },
    messageSent: { type: String, default: '' },
  },
  { timestamps: true }
);

moderationActionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const ModerationAction = mongoose.model('ModerationAction', moderationActionSchema);
export default ModerationAction;
