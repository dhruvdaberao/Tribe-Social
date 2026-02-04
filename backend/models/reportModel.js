import mongoose from 'mongoose';

const reportSchema = mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['post', 'user'], required: true, index: true },
    targetModel: { type: String, enum: ['Post', 'User'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetModel', index: true },
    reason: { type: String, required: true },
    details: { type: String, default: '' },
    status: { type: String, enum: ['open', 'reviewed', 'dismissed', 'actioned'], default: 'open', index: true },
  },
  { timestamps: true }
);

reportSchema.pre('validate', function setTargetModel(next) {
  if (this.targetType === 'post') {
    this.targetModel = 'Post';
  } else if (this.targetType === 'user') {
    this.targetModel = 'User';
  }
  next();
});

reportSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
