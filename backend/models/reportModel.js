import mongoose from 'mongoose';

const reportReasons = ['Spam', 'Harassment', 'Hate Speech', 'Violence', 'Misinformation', 'Scam or Fraud', 'Other'];

const reportSchema = mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reportedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null, index: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reportedTribe: { type: mongoose.Schema.Types.ObjectId, ref: 'Tribe', default: null, index: true },
    reason: { type: String, enum: reportReasons, required: true },
    details: { type: String, default: '', maxlength: 1000 },
    escalatedToSuperAdmin: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'reviewed', 'dismissed', 'actioned'], default: 'open', index: true },
  },
  { timestamps: true }
);

reportSchema.virtual('targetType').get(function getTargetType() {
  if (this.reportedPost) return 'post';
  if (this.reportedUser) return 'user';
  if (this.reportedTribe) return 'tribe';
  return null;
});

reportSchema.virtual('targetId').get(function getTargetId() {
  return this.reportedPost || this.reportedUser || this.reportedTribe || null;
});

reportSchema.pre('validate', function validateSingleTarget(next) {
  const targets = [this.reportedPost, this.reportedUser, this.reportedTribe].filter(Boolean);
  if (targets.length !== 1) {
    return next(new Error('Exactly one of reportedPost, reportedUser, or reportedTribe is required.'));
  }
  next();
});

reportSchema.set('toJSON', {
  virtuals: true,
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
export { reportReasons };
